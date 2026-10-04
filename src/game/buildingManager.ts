import * as THREE from 'three';
import { GameState } from './gameState';
import { GridManager } from './gridManager';
import { AssetBuilder } from './assetBuilder';
import { BuildingEntity, BuildingType } from './types';
import { BUILDING_CONFIGS, TILE_SIZE } from './constants';

export class BuildingManager {
  private gameState: GameState;
  private gridManager: GridManager;
  private scene: THREE.Scene;
  private buildingMeshes: Map<string, THREE.Group> = new Map();
  private ghostMesh: THREE.Group | null = null;
  private currentGhostType: BuildingType | null = null;
  private currentGhostValid: boolean = false;

  constructor(gameState: GameState, gridManager: GridManager, scene: THREE.Scene) {
    this.gameState = gameState;
    this.gridManager = gridManager;
    this.scene = scene;
  }

  public update(): void {
    this.syncMeshes();
  }

  private syncMeshes(): void {
    const activeIds = new Set<string>();

    for (const b of this.gameState.buildings.values()) {
      activeIds.add(b.id);

      if (!this.buildingMeshes.has(b.id)) {
        const mesh = AssetBuilder.createBuildingMesh(b.type);
        // Center the building properly on its grid footprint
        const worldX = (b.gridX + b.width / 2) * TILE_SIZE - TILE_SIZE / 2;
        const worldZ = (b.gridZ + b.height / 2) * TILE_SIZE - TILE_SIZE / 2;
        mesh.position.set(worldX, 0, worldZ);
        mesh.userData = { type: 'building', id: b.id };
        this.scene.add(mesh);
        this.buildingMeshes.set(b.id, mesh);
      } else {
        // Handle construction visuals / scaling
        const mesh = this.buildingMeshes.get(b.id);
        if (mesh && !b.isConstructed) {
          const sc = Math.max(0.2, b.buildProgress);
          mesh.scale.set(1, sc, 1);
        } else if (mesh) {
          mesh.scale.set(1, 1, 1);
        }
      }
    }

    // Remove deleted buildings
    for (const [id, mesh] of this.buildingMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.buildingMeshes.delete(id);
      }
    }
  }

  public setGhostPreview(type: BuildingType | null, gridX: number, gridZ: number): void {
    if (!type) {
      if (this.ghostMesh) {
        this.scene.remove(this.ghostMesh);
        this.ghostMesh = null;
        this.currentGhostType = null;
      }
      return;
    }

    const config = BUILDING_CONFIGS[type];
    const canAfford = this.gameState.canAfford(config.cost);
    const isFree = this.gridManager.isAreaFree(gridX, gridZ, config.width, config.height);
    const isValid = canAfford && isFree;

    // Recreate ghost if type changed or validity changed
    if (this.currentGhostType !== type || this.currentGhostValid !== isValid || !this.ghostMesh) {
      if (this.ghostMesh) {
        this.scene.remove(this.ghostMesh);
      }
      this.ghostMesh = AssetBuilder.createPlacementGhost(type, isValid);
      this.currentGhostType = type;
      this.currentGhostValid = isValid;
      this.scene.add(this.ghostMesh);
    }

    // Position ghost
    const worldX = (gridX + config.width / 2) * TILE_SIZE - TILE_SIZE / 2;
    const worldZ = (gridZ + config.height / 2) * TILE_SIZE - TILE_SIZE / 2;
    this.ghostMesh.position.set(worldX, 0.05, worldZ);
  }

  public placeBuilding(type: BuildingType, gridX: number, gridZ: number): boolean {
    const config = BUILDING_CONFIGS[type];
    if (!config) return false;

    if (!this.gameState.canAfford(config.cost)) {
      this.gameState.addNotification('❌ Not enough resources to build this!', 'warning');
      return false;
    }

    if (!this.gridManager.isAreaFree(gridX, gridZ, config.width, config.height)) {
      this.gameState.addNotification('⚠️ Location is obstructed or out of bounds!', 'warning');
      return false;
    }

    // Deduct cost
    this.gameState.deductCost(config.cost);

    // Create building entity
    const buildingId = 'bld_' + Math.random().toString(36).substring(2, 9);
    const newBuilding: BuildingEntity = {
      id: buildingId,
      type,
      gridX,
      gridZ,
      width: config.width,
      height: config.height,
      isConstructed: false,
      buildProgress: 0,
      assignedWorkerIds: [],
      level: 1,
      createdAt: Date.now(),
    };

    this.gameState.buildings.set(buildingId, newBuilding);
    this.gridManager.occupyArea(gridX, gridZ, config.width, config.height, buildingId);
    this.gameState.recalculateCapacities();
    this.gameState.addNotification(`🏗️ Placed construction for ${config.nameVi}!`, 'info');

    // Remove ghost if done
    this.setGhostPreview(null, 0, 0);
    this.gameState.notifyListeners();
    return true;
  }

  public demolishBuilding(id: string): void {
    const b = this.gameState.buildings.get(id);
    if (!b) return;

    // Refund partial resources
    const config = BUILDING_CONFIGS[b.type];
    if (config?.cost) {
      if (config.cost.food) this.gameState.resources.food += Math.floor(config.cost.food * 0.4);
      if (config.cost.wood) this.gameState.resources.wood += Math.floor(config.cost.wood * 0.4);
      if (config.cost.stone) this.gameState.resources.stone += Math.floor(config.cost.stone * 0.4);
      if (config.cost.metal) this.gameState.resources.metal += Math.floor(config.cost.metal * 0.4);
    }

    // Free workers
    for (const workerId of b.assignedWorkerIds) {
      const cat = this.gameState.cats.get(workerId);
      if (cat) cat.workBuildingId = null;
    }

    this.gridManager.freeArea(b.gridX, b.gridZ, b.width, b.height);
    this.gameState.buildings.delete(id);
    this.gameState.recalculateCapacities();
    this.gameState.addNotification(`🏚️ Demolished ${config.nameVi} (recovered 40% materials).`, 'info');
    this.gameState.notifyListeners();
  }

  public getBuildingMesh(id: string): THREE.Group | undefined {
    return this.buildingMeshes.get(id);
  }
}
