import { GameState } from './gameState';
import { BUILDING_CONFIGS } from './constants';
import { BuildingEntity, CatEntity, ResourceType } from './types';

export class SimulationSystem {
  private gameState: GameState;
  private tickAccumulator: number = 0;
  private readonly TICK_RATE: number = 1.0; // Run economy tick every 1.0 simulated seconds

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  public update(delta: number): void {
    if (this.gameState.settings.gameSpeed === 0) return;

    const effectiveDelta = delta * this.gameState.settings.gameSpeed;
    this.gameState.gameTime += effectiveDelta;

    // Advance day/night cycle
    this.gameState.dayTime = (this.gameState.dayTime + effectiveDelta * this.gameState.settings.dayNightSpeed) % 1;

    // Advance building construction
    this.updateBuildingConstruction(effectiveDelta);

    // Economy & Production ticks
    this.tickAccumulator += effectiveDelta;
    if (this.tickAccumulator >= this.TICK_RATE) {
      this.executeEconomyTick();
      this.tickAccumulator %= this.TICK_RATE;
    }
  }

  private updateBuildingConstruction(delta: number): void {
    let stateChanged = false;

    // Calculate admin cats bonus: each Admin Cat boosts build speed by 25%
    let adminBonus = 0;
    for (const cat of this.gameState.cats.values()) {
      if (cat.role === 'admin') {
        adminBonus += 0.25;
      }
    }
    const buildSpeedMultiplier = 1 + Math.min(adminBonus, 1.5); // cap at 2.5x

    for (const building of this.gameState.buildings.values()) {
      if (!building.isConstructed) {
        const config = BUILDING_CONFIGS[building.type];
        const progressIncrement = (delta / Math.max(config.buildTime, 1)) * buildSpeedMultiplier;
        building.buildProgress += progressIncrement;

        if (building.buildProgress >= 1) {
          building.buildProgress = 1;
          building.isConstructed = true;
          stateChanged = true;
          this.gameState.recalculateCapacities();
          this.gameState.addNotification(`🏗️ ${config.nameVi} finished construction!`, 'success');
        }
      }
    }

    if (stateChanged) {
      this.gameState.notifyListeners();
    }
  }

  private executeEconomyTick(): void {
    const res = this.gameState.resources;
    let netFoodChange = 0;
    let netWoodChange = 0;
    let netStoneChange = 0;
    let netMetalChange = 0;

    // 1. Food Consumption: each cat consumes 0.2 food per tick
    const totalCats = this.gameState.cats.size;
    const catFoodUpkeep = totalCats * 0.2;
    res.food = Math.max(0, res.food - catFoodUpkeep);
    netFoodChange -= catFoodUpkeep;

    // Happiness adjustment based on food sufficiency
    if (res.food <= 0 && totalCats > 0) {
      this.gameState.happiness = Math.max(10, this.gameState.happiness - 1.5);
    } else if (res.food > 20) {
      this.gameState.happiness = Math.min(100, this.gameState.happiness + 0.3);
    }

    // 2. Production & Building consumption
    for (const building of this.gameState.buildings.values()) {
      if (!building.isConstructed) continue;
      const config = BUILDING_CONFIGS[building.type];

      // Check if building has assigned workers
      const workers = building.assignedWorkerIds
        .map((id) => this.gameState.cats.get(id))
        .filter((c): c is CatEntity => !!c);

      // Multiplier from workers & specialization
      let efficiency = 0.2; // Base partial automation even with 0 workers
      if (workers.length > 0) {
        efficiency = 0;
        for (const worker of workers) {
          let roleBoost = 1.0;
          if (building.type === 'farm' && worker.role === 'farmer') {
            roleBoost = 2.0; // +100% boost
          } else if (
            (building.type === 'sawmill' || building.type === 'quarry' || building.type === 'workshop') &&
            worker.role === 'worker'
          ) {
            roleBoost = 1.75; // +75% boost
          } else if (worker.role === 'civilian') {
            roleBoost = 1.0;
          } else if (worker.role === 'admin' && building.type === 'town_hall') {
            roleBoost = 1.5;
          }

          // Cat energy influence
          const energyFactor = Math.max(0.4, worker.energy / 100);
          efficiency += (1.0 / Math.max(1, config.maxWorkers)) * roleBoost * energyFactor;
        }
      }

      // Check resource consumption requirements
      let canRun = true;
      if (config.consumption) {
        for (const [r, amt] of Object.entries(config.consumption) as [ResourceType, number][]) {
          if ((res[r] || 0) < amt) {
            canRun = false;
            break;
          }
        }
      }

      if (canRun) {
        // Deduct inputs
        if (config.consumption) {
          for (const [r, amt] of Object.entries(config.consumption) as [ResourceType, number][]) {
            res[r] = Math.max(0, res[r] - amt);
            if (r === 'wood') netWoodChange -= amt;
            if (r === 'stone') netStoneChange -= amt;
            if (r === 'metal') netMetalChange -= amt;
          }
        }

        // Produce outputs
        if (config.production.food) {
          const gain = config.production.food * efficiency;
          res.food += gain;
          netFoodChange += gain;
        }
        if (config.production.wood) {
          const gain = config.production.wood * efficiency;
          res.wood += gain;
          netWoodChange += gain;
        }
        if (config.production.stone) {
          const gain = config.production.stone * efficiency;
          res.stone += gain;
          netStoneChange += gain;
        }
        if (config.production.metal) {
          const gain = config.production.metal * efficiency;
          res.metal += gain;
          netMetalChange += gain;
        }
      }
    }

    // Round values slightly to prevent runaway precision issues
    res.food = Math.round(res.food * 10) / 10;
    res.wood = Math.round(res.wood * 10) / 10;
    res.stone = Math.round(res.stone * 10) / 10;
    res.metal = Math.round(res.metal * 10) / 10;

    // Check for Cat Immigrants when there is housing available and high happiness
    if (this.gameState.cats.size < this.gameState.populationMax && this.gameState.happiness > 60) {
      if (Math.random() < 0.08) { // Chance per tick
        const roles = ['civilian', 'civilian', 'farmer', 'worker', 'admin', 'soldier'];
        const chosenRole = roles[Math.floor(Math.random() * roles.length)];
        
        // Find empty house
        let homeId: string | null = null;
        for (const b of this.gameState.buildings.values()) {
          if (b.type === 'cat_house' || b.type === 'town_hall') {
            homeId = b.id;
            break;
          }
        }

        const newCat = this.gameState.spawnCat(
          undefined,
          chosenRole,
          16,
          16,
          homeId,
          null
        );
        this.gameState.addNotification(`😺 A new ${newCat.role} cat named ${newCat.name} joined your kingdom!`, 'success');
      }
    }

    this.gameState.notifyListeners();
  }
}
