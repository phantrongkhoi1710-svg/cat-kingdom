import { BuildingEntity, CatEntity, GameSaveData, GameSettings, NotificationItem, Resources } from './types';
import { BUILDING_CONFIGS, CUTE_CAT_NAMES } from './constants';

export class GameState {
  private static instance: GameState;

  public resources: Resources = {
    food: 100,
    wood: 120,
    stone: 80,
    metal: 40,
  };

  public buildings: Map<string, BuildingEntity> = new Map();
  public cats: Map<string, CatEntity> = new Map();

  public populationMax: number = 5;
  public happiness: number = 85;
  public gameTime: number = 0; // elapsed seconds
  public dayTime: number = 0.25; // 0 to 1 (0 = midnight, 0.25 = sunrise/morning, 0.5 = noon, 0.75 = sunset)

  public settings: GameSettings = {
    gameSpeed: 1,
    soundEnabled: true,
    autoAssignJobs: true,
    dayNightSpeed: 0.005, // one full day cycle ~ 200 seconds
  };

  public selectedEntity: { type: 'building' | 'cat'; id: string } | null = null;
  public activePlacementType: string | null = null;

  public notifications: NotificationItem[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.initInitialWorld();
  }

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public addNotification(text: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info'): void {
    const item: NotificationItem = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
      timestamp: Date.now(),
    };
    this.notifications.unshift(item);
    if (this.notifications.length > 6) {
      this.notifications.pop();
    }
    this.notifyListeners();
  }

  private initInitialWorld(): void {
    // Add starting Town Hall in the center of the 36x36 grid
    const townHallId = 'th_initial';
    const initialTownHall: BuildingEntity = {
      id: townHallId,
      type: 'town_hall',
      gridX: 16,
      gridZ: 16,
      width: 3,
      height: 3,
      isConstructed: true,
      buildProgress: 1,
      assignedWorkerIds: [],
      level: 1,
      createdAt: Date.now(),
    };
    this.buildings.set(townHallId, initialTownHall);

    // Initial Cat House nearby
    const houseId = 'house_initial';
    const initialHouse: BuildingEntity = {
      id: houseId,
      type: 'cat_house',
      gridX: 12,
      gridZ: 16,
      width: 2,
      height: 2,
      isConstructed: true,
      buildProgress: 1,
      assignedWorkerIds: [],
      level: 1,
      createdAt: Date.now(),
    };
    this.buildings.set(houseId, initialHouse);

    // Initial Farm nearby
    const farmId = 'farm_initial';
    const initialFarm: BuildingEntity = {
      id: farmId,
      type: 'farm',
      gridX: 20,
      gridZ: 16,
      width: 2,
      height: 2,
      isConstructed: true,
      buildProgress: 1,
      assignedWorkerIds: [],
      level: 1,
      createdAt: Date.now(),
    };
    this.buildings.set(farmId, initialFarm);

    // Initial cats
    this.spawnCat('Mochi', 'civilian', 13, 17, houseId, farmId);
    this.spawnCat('Boba', 'farmer', 14, 16, houseId, farmId);
    this.spawnCat('Wasabi', 'worker', 17, 17, townHallId, null);

    this.recalculateCapacities();
    this.addNotification('🐾 Welcome to Cat Kingdom! Grow your feline metropolis.', 'success');
  }

  public spawnCat(
    name?: string,
    role: any = 'civilian',
    gridX: number = 16,
    gridZ: number = 16,
    homeId: string | null = null,
    workId: string | null = null
  ): CatEntity {
    const catName = name || CUTE_CAT_NAMES[Math.floor(Math.random() * CUTE_CAT_NAMES.length)];
    const catId = 'cat_' + Math.random().toString(36).substring(2, 9);
    
    const newCat: CatEntity = {
      id: catId,
      name: catName,
      role: role,
      state: 'idle',
      happiness: 90,
      energy: 100,
      homeBuildingId: homeId,
      workBuildingId: workId,
      gridX,
      gridZ,
      targetGridX: null,
      targetGridZ: null,
      stateTimer: 2 + Math.random() * 3,
    };

    this.cats.set(catId, newCat);

    if (workId) {
      const b = this.buildings.get(workId);
      if (b && !b.assignedWorkerIds.includes(catId)) {
        b.assignedWorkerIds.push(catId);
      }
    }

    return newCat;
  }

  public recalculateCapacities(): void {
    let maxPop = 0;
    for (const b of this.buildings.values()) {
      if (b.isConstructed) {
        const cfg = BUILDING_CONFIGS[b.type];
        if (cfg?.housingCapacity) {
          maxPop += cfg.housingCapacity;
        }
      }
    }
    this.populationMax = Math.max(maxPop, 4);
  }

  public canAfford(cost: Partial<Resources>): boolean {
    if (cost.food && this.resources.food < cost.food) return false;
    if (cost.wood && this.resources.wood < cost.wood) return false;
    if (cost.stone && this.resources.stone < cost.stone) return false;
    if (cost.metal && this.resources.metal < cost.metal) return false;
    return true;
  }

  public deductCost(cost: Partial<Resources>): void {
    if (cost.food) this.resources.food -= cost.food;
    if (cost.wood) this.resources.wood -= cost.wood;
    if (cost.stone) this.resources.stone -= cost.stone;
    if (cost.metal) this.resources.metal -= cost.metal;
  }

  public saveToLocalStorage(): boolean {
    try {
      const data: GameSaveData = {
        version: 1,
        timestamp: Date.now(),
        resources: { ...this.resources },
        populationMax: this.populationMax,
        happiness: this.happiness,
        buildings: Array.from(this.buildings.values()),
        cats: Array.from(this.cats.values()),
        gameTime: this.gameTime,
        dayTime: this.dayTime,
      };
      localStorage.setItem('cat_kingdom_save_v1', JSON.stringify(data));
      this.addNotification('💾 Game saved successfully!', 'success');
      return true;
    } catch (err) {
      console.error('Failed to save game', err);
      this.addNotification('❌ Could not save game to local storage', 'alert');
      return false;
    }
  }

  public loadFromLocalStorage(): boolean {
    try {
      const raw = localStorage.getItem('cat_kingdom_save_v1');
      if (!raw) {
        this.addNotification('No saved game found.', 'warning');
        return false;
      }
      const data: GameSaveData = JSON.parse(raw);
      this.resources = data.resources;
      this.populationMax = data.populationMax;
      this.happiness = data.happiness;
      this.gameTime = data.gameTime;
      this.dayTime = data.dayTime;

      this.buildings.clear();
      for (const b of data.buildings) {
        this.buildings.set(b.id, b);
      }

      this.cats.clear();
      for (const c of data.cats) {
        this.cats.set(c.id, c);
      }

      this.recalculateCapacities();
      this.notifyListeners();
      this.addNotification('📂 Kingdom loaded successfully!', 'success');
      return true;
    } catch (err) {
      console.error('Failed to load game', err);
      this.addNotification('❌ Failed to load save file', 'alert');
      return false;
    }
  }

  public resetGame(): void {
    localStorage.removeItem('cat_kingdom_save_v1');
    this.buildings.clear();
    this.cats.clear();
    this.resources = { food: 100, wood: 120, stone: 80, metal: 40 };
    this.happiness = 85;
    this.gameTime = 0;
    this.dayTime = 0.25;
    this.selectedEntity = null;
    this.activePlacementType = null;
    this.initInitialWorld();
    this.notifyListeners();
    this.addNotification('✨ Starting a brand new Kingdom!', 'info');
  }
}
