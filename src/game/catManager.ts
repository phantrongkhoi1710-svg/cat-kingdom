import * as THREE from 'three';
import { GameState } from './gameState';
import { GridManager } from './gridManager';
import { AssetBuilder } from './assetBuilder';
import { CatEntity, CatState } from './types';
import { TILE_SIZE } from './constants';

export class CatManager {
  private gameState: GameState;
  private gridManager: GridManager;
  private scene: THREE.Scene;
  private catMeshes: Map<string, THREE.Group> = new Map();

  // Internal path queues for cats
  private catPaths: Map<string, { x: number; z: number }[]> = new Map();

  constructor(gameState: GameState, gridManager: GridManager, scene: THREE.Scene) {
    this.gameState = gameState;
    this.gridManager = gridManager;
    this.scene = scene;
  }

  public update(delta: number): void {
    const speed = this.gameState.settings.gameSpeed;
    if (speed === 0) return;

    const dt = delta * speed;

    // Check newly spawned or removed cats
    this.syncMeshes();

    // Update cat AI state machine
    for (const cat of this.gameState.cats.values()) {
      this.updateCatAI(cat, dt);
      this.updateCatMovement(cat, dt);
    }
  }

  private syncMeshes(): void {
    const activeIds = new Set<string>();

    for (const cat of this.gameState.cats.values()) {
      activeIds.add(cat.id);

      if (!this.catMeshes.has(cat.id)) {
        const mesh = AssetBuilder.createCatMesh(cat.role);
        mesh.position.set(cat.gridX * TILE_SIZE, 0, cat.gridZ * TILE_SIZE);
        mesh.userData = { type: 'cat', id: cat.id };
        this.scene.add(mesh);
        this.catMeshes.set(cat.id, mesh);
      }
    }

    // Clean up deceased or removed cats
    for (const [id, mesh] of this.catMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.catMeshes.delete(id);
        this.catPaths.delete(id);
      }
    }
  }

  private updateCatAI(cat: CatEntity, dt: number): void {
    cat.stateTimer -= dt;

    // Gradual energy drain while awake
    if (cat.state === 'working' || cat.state === 'walking') {
      cat.energy = Math.max(0, cat.energy - dt * 0.8);
    } else if (cat.state === 'sleeping') {
      cat.energy = Math.min(100, cat.energy + dt * 4.0);
    }

    // State machine transitions
    if (cat.stateTimer <= 0) {
      this.transitionCatState(cat);
    }
  }

  private transitionCatState(cat: CatEntity): void {
    const dayTime = this.gameState.dayTime;
    const isNight = dayTime < 0.2 || dayTime > 0.8;

    // If tired or night time -> return home & sleep
    if (isNight || cat.energy < 20) {
      if (cat.state !== 'sleeping' && cat.state !== 'returning_home') {
        const home = cat.homeBuildingId ? this.gameState.buildings.get(cat.homeBuildingId) : null;
        if (home) {
          cat.state = 'returning_home';
          this.setCatDestination(cat, home.gridX, home.gridZ);
          cat.stateTimer = 15;
          return;
        }
      }
    }

    switch (cat.state) {
      case 'idle': {
        // Decide between going to work, wandering, or napping
        if (!isNight && cat.workBuildingId && cat.energy > 30) {
          const workplace = this.gameState.buildings.get(cat.workBuildingId);
          if (workplace && workplace.isConstructed) {
            cat.state = 'walking';
            this.setCatDestination(cat, workplace.gridX, workplace.gridZ);
            cat.stateTimer = 12;
            break;
          }
        }

        // Just take a friendly stroll around the kingdom
        cat.state = 'walking';
        const randomTarget = this.findNearbyWalkableTile(cat.gridX, cat.gridZ, 4);
        this.setCatDestination(cat, randomTarget.x, randomTarget.z);
        cat.stateTimer = 4 + Math.random() * 4;
        break;
      }

      case 'walking': {
        // Finished walking
        if (cat.workBuildingId) {
          cat.state = 'working';
          cat.stateTimer = 8 + Math.random() * 6; // Work for 8-14s
        } else {
          cat.state = 'idle';
          cat.stateTimer = 3 + Math.random() * 4;
        }
        break;
      }

      case 'working': {
        // Take a small break or continue
        if (cat.energy < 25) {
          cat.state = 'returning_home';
          const home = cat.homeBuildingId ? this.gameState.buildings.get(cat.homeBuildingId) : null;
          if (home) {
            this.setCatDestination(cat, home.gridX, home.gridZ);
          }
          cat.stateTimer = 15;
        } else {
          cat.state = 'idle';
          cat.stateTimer = 3 + Math.random() * 3;
        }
        break;
      }

      case 'returning_home': {
        cat.state = 'sleeping';
        cat.stateTimer = 10 + Math.random() * 5;
        break;
      }

      case 'sleeping': {
        if (!isNight && cat.energy > 80) {
          cat.state = 'idle';
          cat.stateTimer = 2;
        } else {
          cat.stateTimer = 5;
        }
        break;
      }
    }
  }

  private setCatDestination(cat: CatEntity, targetX: number, targetZ: number): void {
    cat.targetGridX = targetX;
    cat.targetGridZ = targetZ;

    const path = this.gridManager.findPath(
      Math.round(cat.gridX),
      Math.round(cat.gridZ),
      targetX,
      targetZ,
      true
    );

    if (path.length > 0) {
      // drop the starting tile
      path.shift();
      this.catPaths.set(cat.id, path);
    }
  }

  private findNearbyWalkableTile(cx: number, cz: number, radius: number): { x: number; z: number } {
    const rx = Math.max(1, Math.min(34, Math.round(cx + (Math.random() * 2 - 1) * radius)));
    const rz = Math.max(1, Math.min(34, Math.round(cz + (Math.random() * 2 - 1) * radius)));
    return { x: rx, z: rz };
  }

  private updateCatMovement(cat: CatEntity, dt: number): void {
    const mesh = this.catMeshes.get(cat.id);
    if (!mesh) return;

    const path = this.catPaths.get(cat.id);
    const moveSpeed = 2.2 * dt; // Units per second

    if (path && path.length > 0) {
      const nextTile = path[0];
      const targetWorldX = nextTile.x * TILE_SIZE;
      const targetWorldZ = nextTile.z * TILE_SIZE;

      const dx = targetWorldX - mesh.position.x;
      const dz = targetWorldZ - mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.1) {
        mesh.position.x = targetWorldX;
        mesh.position.z = targetWorldZ;
        cat.gridX = nextTile.x;
        cat.gridZ = nextTile.z;
        path.shift();
      } else {
        mesh.position.x += (dx / dist) * Math.min(moveSpeed, dist);
        mesh.position.z += (dz / dist) * Math.min(moveSpeed, dist);

        // Turn cat towards movement direction
        const angle = Math.atan2(dx, dz);
        mesh.rotation.y = angle;

        // Cute bouncy walking hop
        mesh.position.y = Math.abs(Math.sin(Date.now() * 0.01)) * 0.15;

        // Wag tail!
        const tail = mesh.getObjectByName('cat_tail');
        if (tail) {
          tail.rotation.z = Math.sin(Date.now() * 0.015) * 0.35;
        }

        cat.gridX = mesh.position.x / TILE_SIZE;
        cat.gridZ = mesh.position.z / TILE_SIZE;
      }
    } else {
      // Idle breathing / resting animation
      if (cat.state === 'sleeping') {
        mesh.position.y = -0.15; // curling down
        mesh.scale.set(0.85, 0.65, 0.85);
      } else {
        mesh.position.y = 0;
        mesh.scale.set(0.85, 0.85, 0.85);

        // Subtle head tilt
        const head = mesh.getObjectByName('cat_head');
        if (head) {
          head.rotation.z = Math.sin(Date.now() * 0.003 + parseInt(cat.id.slice(-2), 16) || 0) * 0.08;
        }
      }
    }
  }

  public getCatMesh(id: string): THREE.Group | undefined {
    return this.catMeshes.get(id);
  }
}
