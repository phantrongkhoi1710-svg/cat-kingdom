import './style.css';
import { GameState } from './game/gameState';
import { GridManager } from './game/gridManager';
import { WorldScene } from './game/worldScene';
import { BuildingManager } from './game/buildingManager';
import { CatManager } from './game/catManager';
import { SimulationSystem } from './game/simulationSystem';
import { UIManager } from './ui/uiManager';
import { TILE_SIZE } from './game/constants';
import { BuildingType } from './game/types';

class CatKingdomGame {
  private gameState: GameState;
  private gridManager: GridManager;
  private worldScene: WorldScene;
  private buildingManager: BuildingManager;
  private catManager: CatManager;
  private simulationSystem: SimulationSystem;
  private uiManager: UIManager;

  private lastTime: number = performance.now();
  private mouseMovedAfterDown: boolean = false;
  private mouseDownPos = { x: 0, y: 0 };

  constructor() {
    const canvasContainer = document.getElementById('game-canvas-container')!;
    const uiContainer = document.getElementById('ui-root')!;

    // 1. Core instances
    this.gameState = GameState.getInstance();
    this.gridManager = new GridManager();
    this.gridManager.rebuildGridOccupancy(this.gameState.buildings.values());

    // 2. 3D World Scene
    this.worldScene = new WorldScene(canvasContainer);

    // 3. Domain Managers
    this.buildingManager = new BuildingManager(this.gameState, this.gridManager, this.worldScene.scene);
    this.catManager = new CatManager(this.gameState, this.gridManager, this.worldScene.scene);
    this.simulationSystem = new SimulationSystem(this.gameState);

    // 4. UI Manager
    this.uiManager = new UIManager(uiContainer, this.gameState, this.buildingManager, this.catManager);

    // 5. User Interaction & Picking
    this.setupInteractions(canvasContainer);

    // 6. Game loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private setupInteractions(container: HTMLElement): void {
    container.addEventListener('mousedown', (e) => {
      this.mouseMovedAfterDown = false;
      this.mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    container.addEventListener('mousemove', (e) => {
      const dist = Math.hypot(e.clientX - this.mouseDownPos.x, e.clientY - this.mouseDownPos.y);
      if (dist > 5) {
        this.mouseMovedAfterDown = true;
      }

      // Handle Ghost Preview when building placement is active
      if (this.gameState.activePlacementType) {
        const point = this.worldScene.getGroundIntersection(e.clientX, e.clientY);
        if (point) {
          const gx = Math.floor((point.x + TILE_SIZE / 2) / TILE_SIZE);
          const gz = Math.floor((point.z + TILE_SIZE / 2) / TILE_SIZE);
          this.buildingManager.setGhostPreview(this.gameState.activePlacementType as BuildingType, gx, gz);
        }
      }
    });

    container.addEventListener('click', (e) => {
      if (this.mouseMovedAfterDown) return; // ignore drags

      // 1. If in placement mode -> attempt placement
      if (this.gameState.activePlacementType) {
        const point = this.worldScene.getGroundIntersection(e.clientX, e.clientY);
        if (point) {
          const gx = Math.floor((point.x + TILE_SIZE / 2) / TILE_SIZE);
          const gz = Math.floor((point.z + TILE_SIZE / 2) / TILE_SIZE);
          const placed = this.buildingManager.placeBuilding(this.gameState.activePlacementType as BuildingType, gx, gz);
          if (placed) {
            this.gameState.activePlacementType = null;
          }
        }
        return;
      }

      // 2. Selection raycast for buildings and cats
      const hit = this.worldScene.getIntersectedObject(e.clientX, e.clientY);
      if (hit && hit.userData && hit.userData.id) {
        this.gameState.selectedEntity = {
          type: hit.userData.type,
          id: hit.userData.id,
        };
        this.uiManager.updateInspector();
      } else {
        // Deselect when clicking ground
        if (this.gameState.selectedEntity) {
          this.gameState.selectedEntity = null;
          this.uiManager.updateInspector();
        }
      }
    });

    // Right-click cancels building placement
    container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.gameState.activePlacementType) {
        this.gameState.activePlacementType = null;
        this.buildingManager.setGhostPreview(null, 0, 0);
        this.uiManager.updateUI();
      }
    });
  }

  private gameLoop(time: number): void {
    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // 1. Advance simulation (economy, construction)
    this.simulationSystem.update(delta);

    // 2. Update Cat AI and bouncy movement
    this.catManager.update(delta);

    // 3. Update Building meshes
    this.buildingManager.update();

    // 4. Update Day/Night lights
    this.worldScene.updateDayNightVisuals(this.gameState.dayTime);

    // 5. Render Three.js frame
    this.worldScene.renderer.render(this.worldScene.scene, this.worldScene.camera);

    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

// Start game
window.addEventListener('DOMContentLoaded', () => {
  new CatKingdomGame();
});
