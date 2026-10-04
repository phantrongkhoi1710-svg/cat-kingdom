import { GRID_SIZE } from './constants';
import { BuildingEntity } from './types';

export interface GridTile {
  x: number;
  z: number;
  isOccupied: boolean;
  occupantId: string | null;
  elevation: number;
  hasRoad: boolean;
  isWater: boolean;
}

export class GridManager {
  private tiles: GridTile[][] = [];

  constructor() {
    this.initGrid();
  }

  private initGrid(): void {
    for (let x = 0; x < GRID_SIZE; x++) {
      this.tiles[x] = [];
      for (let z = 0; z < GRID_SIZE; z++) {
        // Natural gentle pond or river decoration at extreme borders
        const isWater = (x < 2 && z < 2) || (x > GRID_SIZE - 3 && z > GRID_SIZE - 3);
        this.tiles[x][z] = {
          x,
          z,
          isOccupied: isWater,
          occupantId: isWater ? 'water' : null,
          elevation: 0,
          hasRoad: false,
          isWater,
        };
      }
    }
  }

  public rebuildGridOccupancy(buildings: Iterable<BuildingEntity>): void {
    // Reset occupied states (except water)
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        if (!this.tiles[x][z].isWater) {
          this.tiles[x][z].isOccupied = false;
          this.tiles[x][z].occupantId = null;
        }
      }
    }

    // Mark building footprints
    for (const b of buildings) {
      for (let dx = 0; dx < b.width; dx++) {
        for (let dz = 0; dz < b.height; dz++) {
          const gx = b.gridX + dx;
          const gz = b.gridZ + dz;
          if (this.isValidTile(gx, gz)) {
            this.tiles[gx][gz].isOccupied = true;
            this.tiles[gx][gz].occupantId = b.id;
          }
        }
      }
    }
  }

  public isValidTile(x: number, z: number): boolean {
    return x >= 0 && x < GRID_SIZE && z >= 0 && z < GRID_SIZE;
  }

  public isAreaFree(startX: number, startZ: number, width: number, height: number): boolean {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        const gx = startX + x;
        const gz = startZ + z;
        if (!this.isValidTile(gx, gz)) return false;
        if (this.tiles[gx][gz].isOccupied) return false;
      }
    }
    return true;
  }

  public occupyArea(startX: number, startZ: number, width: number, height: number, occupantId: string): void {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        const gx = startX + x;
        const gz = startZ + z;
        if (this.isValidTile(gx, gz)) {
          this.tiles[gx][gz].isOccupied = true;
          this.tiles[gx][gz].occupantId = occupantId;
        }
      }
    }
  }

  public freeArea(startX: number, startZ: number, width: number, height: number): void {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        const gx = startX + x;
        const gz = startZ + z;
        if (this.isValidTile(gx, gz)) {
          this.tiles[gx][gz].isOccupied = false;
          this.tiles[gx][gz].occupantId = null;
        }
      }
    }
  }

  public getTile(x: number, z: number): GridTile | null {
    if (!this.isValidTile(x, z)) return null;
    return this.tiles[x][z];
  }

  // Simple Breadth-First-Search Pathfinding for cats moving across grid
  public findPath(
    startX: number,
    startZ: number,
    targetX: number,
    targetZ: number,
    allowTargetOccupied: boolean = true
  ): { x: number; z: number }[] {
    if (!this.isValidTile(startX, startZ) || !this.isValidTile(targetX, targetZ)) {
      return [{ x: startX, z: startZ }];
    }

    if (startX === targetX && startZ === targetZ) {
      return [{ x: startX, z: startZ }];
    }

    const queue: { x: number; z: number }[] = [{ x: startX, z: startZ }];
    const visited = new Set<string>();
    const parentMap = new Map<string, { x: number; z: number }>();

    const key = (x: number, z: number) => `${x},${z}`;
    visited.add(key(startX, startZ));

    const dirs = [
      { x: 1, z: 0 },
      { x: -1, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: -1 },
    ];

    let found = false;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.x === targetX && current.z === targetZ) {
        found = true;
        break;
      }

      for (const dir of dirs) {
        const nx = current.x + dir.x;
        const nz = current.z + dir.z;

        if (!this.isValidTile(nx, nz)) continue;
        const nKey = key(nx, nz);
        if (visited.has(nKey)) continue;

        const isTarget = nx === targetX && nz === targetZ;
        const isBlocked = this.tiles[nx][nz].isOccupied && (!isTarget || !allowTargetOccupied);

        if (!isBlocked) {
          visited.add(nKey);
          parentMap.set(nKey, current);
          queue.push({ x: nx, z: nz });
        }
      }
    }

    if (!found) {
      // If direct path blocked, return straight line approximation step
      const stepX = startX + Math.sign(targetX - startX);
      const stepZ = startZ + Math.sign(targetZ - startZ);
      return [{ x: startX, z: startZ }, { x: stepX, z: stepZ }];
    }

    // Reconstruct path
    const path: { x: number; z: number }[] = [];
    let curr: { x: number; z: number } | undefined = { x: targetX, z: targetZ };

    while (curr) {
      path.unshift(curr);
      curr = parentMap.get(key(curr.x, curr.z));
      if (curr?.x === startX && curr?.z === startZ) {
        break;
      }
    }

    return path;
  }
}
