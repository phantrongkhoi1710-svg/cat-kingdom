import { BuildingConfig, BuildingType, CatRole } from './types';

export const GRID_SIZE = 36; // 36x36 tiles
export const TILE_SIZE = 2;   // 2 Three.js units per tile

export const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
  town_hall: {
    type: 'town_hall',
    name: 'Town Hall',
    nameVi: 'Tòa Thị Chính Mèo',
    description: 'The administrative heart of the kingdom. Admin cats here supervise town efficiency.',
    width: 3,
    height: 3,
    cost: { wood: 50, stone: 30, food: 30 },
    buildTime: 8,
    maxWorkers: 2,
    production: {},
    consumption: {},
    housingCapacity: 4,
    icon: '👑',
    color: 0x9333ea,
    accentColor: 0xfacc15,
  },
  cat_house: {
    type: 'cat_house',
    name: 'Cat Cozy Villa',
    nameVi: 'Nhà Ở Cho Mèo',
    description: 'Provides warm beds and milk for 5 feline citizens.',
    width: 2,
    height: 2,
    cost: { wood: 30, stone: 10 },
    buildTime: 5,
    maxWorkers: 0,
    production: {},
    consumption: { food: 0.5 },
    housingCapacity: 5,
    icon: '🏡',
    color: 0xf59e0b,
    accentColor: 0xfbbf24,
  },
  farm: {
    type: 'farm',
    name: 'Fish & Catnip Farm',
    nameVi: 'Nông Trại Cá & Cỏ Mèo',
    description: 'Produces succulent fish and fresh catnip to feed your cats. Farmer cats thrive here!',
    width: 2,
    height: 2,
    cost: { wood: 20 },
    buildTime: 4,
    maxWorkers: 3,
    production: { food: 6 },
    consumption: {},
    icon: '🐟',
    color: 0x22c55e,
    accentColor: 0x86efac,
  },
  sawmill: {
    type: 'sawmill',
    name: 'Scratching Post Mill',
    nameVi: 'Xưởng Cưa Gỗ Cào Móng',
    description: 'Harvests timber from scratch-friendly logs. Worker cats excel here.',
    width: 2,
    height: 2,
    cost: { food: 15, wood: 10 },
    buildTime: 5,
    maxWorkers: 3,
    production: { wood: 5 },
    consumption: {},
    icon: '🪓',
    color: 0xb45309,
    accentColor: 0xd97706,
  },
  quarry: {
    type: 'quarry',
    name: 'Yarn Stone Quarry',
    nameVi: 'Mỏ Đá Cuội Cuộn',
    description: 'Extracts sturdy stones for grand cat architecture.',
    width: 2,
    height: 2,
    cost: { wood: 35, food: 20 },
    buildTime: 6,
    maxWorkers: 3,
    production: { stone: 4 },
    consumption: {},
    icon: '⛏️',
    color: 0x64748b,
    accentColor: 0x94a3b8,
  },
  workshop: {
    type: 'workshop',
    name: 'Tuna Can Factory',
    nameVi: 'Xưởng Chế Tác Kim Loại',
    description: 'Smelts metal bells, cans and armor. Requires Stone and Wood.',
    width: 2,
    height: 2,
    cost: { wood: 45, stone: 40 },
    buildTime: 8,
    maxWorkers: 2,
    production: { metal: 3 },
    consumption: { wood: 1, stone: 1 },
    icon: '⚙️',
    color: 0x0284c7,
    accentColor: 0x38bdf8,
  },
  barracks: {
    type: 'barracks',
    name: 'Paw Guard Barracks',
    nameVi: 'Doanh Trại Mèo Binh',
    description: 'Trains brave soldier cats to patrol and defend the kingdom borders.',
    width: 2,
    height: 2,
    cost: { wood: 60, stone: 50, metal: 20 },
    buildTime: 10,
    maxWorkers: 4,
    production: {},
    consumption: { food: 2 },
    icon: '⚔️',
    color: 0xd97706,
    accentColor: 0xef4444,
  },
};

export const CAT_ROLE_DATA: Record<CatRole, {
  name: string;
  nameVi: string;
  description: string;
  color: number;
  secondaryColor: number;
  icon: string;
  bonuses: string;
}> = {
  civilian: {
    name: 'Civilian Cat',
    nameVi: 'Mèo Dân',
    description: 'Versatile citizen that can take any basic chore.',
    color: 0xfef08a, // Soft Cream Yellow
    secondaryColor: 0xf59e0b,
    icon: '🐱',
    bonuses: 'Standard 1x production multiplier',
  },
  farmer: {
    name: 'Farmer Cat',
    nameVi: 'Mèo Nông Dân',
    description: 'Master of fish harvesting and catnip hydroponics.',
    color: 0x86efac, // Mint Green
    secondaryColor: 0x16a34a,
    icon: '🌾',
    bonuses: '+100% Food production on Farms',
  },
  worker: {
    name: 'Worker Cat',
    nameVi: 'Mèo Thợ',
    description: 'Strong paws suited for sawmills, quarries, and workshops.',
    color: 0xfbcfe8, // Calico / Coral
    secondaryColor: 0xdb2777,
    icon: '🔨',
    bonuses: '+75% Wood, Stone, Metal extraction',
  },
  admin: {
    name: 'Admin Cat',
    nameVi: 'Mèo Quan Tinh Anh',
    description: 'Wears an elegant monocle and conducts town governance.',
    color: 0xc4b5fd, // Royal Purple / Lilac
    secondaryColor: 0x7c3aed,
    icon: '📜',
    bonuses: '-30% Construction time & +10 Kingdom Happiness',
  },
  soldier: {
    name: 'Soldier Cat',
    nameVi: 'Mèo Binh Dũng Cảm',
    description: 'Equipped with paw daggers and cardboard shield for kingdom vigilance.',
    color: 0xfca5a5, // Brave Crimson
    secondaryColor: 0xdc2626,
    icon: '🛡️',
    bonuses: 'Maintains public safety, keeps mice monsters away',
  },
};

export const CUTE_CAT_NAMES = [
  'Mochi', 'Boba', 'Neko', 'Luna', 'Simba', 'Oliver', 'Milo', 'Bella',
  'Leo', 'Loki', 'Cleo', 'Bao', 'Tofu', 'Wasabi', 'Matcha', 'Pudding',
  'Caramel', 'Ginger', 'Pepper', 'Oreo', 'Coco', 'Socks', 'Mittens', 'Whiskers',
  'Felix', 'Barnaby', 'Penny', 'Daisy', 'Hazel', 'Cosmo', 'Ziggy', 'Kiki',
  'Mimi', 'Chonky', 'Baozi', 'Sushi', 'Dumpling', 'Croissant', 'Pancake', 'Butter'
];
