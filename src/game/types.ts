export type ResourceType = 'food' | 'wood' | 'stone' | 'metal';

export interface Resources {
  food: number;
  wood: number;
  stone: number;
  metal: number;
}

export type CatRole = 'civilian' | 'farmer' | 'worker' | 'admin' | 'soldier';

export type CatState = 'idle' | 'walking' | 'working' | 'returning_home' | 'sleeping';

export interface CatEntity {
  id: string;
  name: string;
  role: CatRole;
  state: CatState;
  happiness: number; // 0 - 100
  energy: number;    // 0 - 100
  homeBuildingId: string | null;
  workBuildingId: string | null;
  gridX: number;
  gridZ: number;
  targetGridX: number | null;
  targetGridZ: number | null;
  stateTimer: number; // seconds left in current state
  // Visual mesh reference ID or color
  meshId?: string;
  carriedResource?: { type: ResourceType; amount: number } | null;
}

export type BuildingType = 
  | 'cat_house' 
  | 'farm' 
  | 'sawmill' 
  | 'quarry' 
  | 'workshop' 
  | 'town_hall' 
  | 'barracks';

export interface BuildingCost {
  food?: number;
  wood?: number;
  stone?: number;
  metal?: number;
}

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  nameVi: string;
  description: string;
  width: number; // grid size
  height: number;
  cost: BuildingCost;
  buildTime: number; // in seconds
  maxWorkers: number;
  production: Partial<Record<ResourceType, number>>; // per tick (e.g. per 2s)
  consumption: Partial<Record<ResourceType, number>>;
  housingCapacity?: number;
  icon: string;
  color: number;
  accentColor: number;
  unlockCost?: number;
}

export interface BuildingEntity {
  id: string;
  type: BuildingType;
  gridX: number;
  gridZ: number;
  width: number;
  height: number;
  isConstructed: boolean;
  buildProgress: number; // 0 to 1
  assignedWorkerIds: string[];
  level: number;
  createdAt: number;
}

export interface GameSettings {
  gameSpeed: number; // 0 (paused), 1, 2, 3
  soundEnabled: boolean;
  autoAssignJobs: boolean;
  dayNightSpeed: number;
}

export interface NotificationItem {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: number;
}

export interface GameSaveData {
  version: number;
  timestamp: number;
  resources: Resources;
  populationMax: number;
  happiness: number;
  buildings: BuildingEntity[];
  cats: CatEntity[];
  gameTime: number;
  dayTime: number;
}
