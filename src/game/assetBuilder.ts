import * as THREE from 'three';
import { BuildingType } from './types';
import { BUILDING_CONFIGS, CAT_ROLE_DATA } from './constants';

export class AssetBuilder {
  private static materials: Map<string, THREE.Material> = new Map();

  private static getMaterial(color: number, roughness: number = 0.5): THREE.MeshStandardMaterial {
    const key = `mat_${color.toString(16)}_${roughness}`;
    if (!this.materials.has(key)) {
      this.materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness: 0.1,
          flatShading: true,
        })
      );
    }
    return this.materials.get(key) as THREE.MeshStandardMaterial;
  }

  /**
   * Generates a stylized, low-poly cute anthropomorphic cat mesh!
   * Complete with body, head, triangular ears, whiskers snout, cute tail, and role props!
   */
  public static createCatMesh(role: string = 'civilian'): THREE.Group {
    const group = new THREE.Group();
    const roleInfo = (CAT_ROLE_DATA as any)[role] || CAT_ROLE_DATA.civilian;

    const bodyMat = this.getMaterial(roleInfo.color, 0.6);
    const accentMat = this.getMaterial(roleInfo.secondaryColor, 0.4);
    const darkMat = this.getMaterial(0x1e293b, 0.8);
    const whiteMat = this.getMaterial(0xffffff, 0.3);
    const pinkMat = this.getMaterial(0xf472b6, 0.5);

    // 1. Cat Body (Chubby rounded box)
    const bodyGeom = new THREE.BoxGeometry(0.55, 0.65, 0.5);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.45;
    body.castShadow = true;
    body.receiveShadow = true;
    body.name = 'cat_body';
    group.add(body);

    // Belly patch
    const bellyGeom = new THREE.BoxGeometry(0.4, 0.45, 0.1);
    const belly = new THREE.Mesh(bellyGeom, whiteMat);
    belly.position.set(0, 0.42, 0.22);
    group.add(belly);

    // 2. Head
    const headGeom = new THREE.BoxGeometry(0.6, 0.5, 0.55);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 0.95;
    head.castShadow = true;
    head.name = 'cat_head';
    group.add(head);

    // 3. Cat Ears (Cone / pyramid)
    const earGeom = new THREE.ConeGeometry(0.16, 0.25, 4);
    earGeom.rotateY(Math.PI / 4);

    const leftEar = new THREE.Mesh(earGeom, accentMat);
    leftEar.position.set(-0.2, 1.25, 0.05);
    leftEar.rotation.z = 0.15;
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, accentMat);
    rightEar.position.set(0.2, 1.25, 0.05);
    rightEar.rotation.z = -0.15;
    group.add(rightEar);

    // Inner pink ears
    const innerEarGeom = new THREE.ConeGeometry(0.09, 0.16, 4);
    innerEarGeom.rotateY(Math.PI / 4);
    const leftInner = new THREE.Mesh(innerEarGeom, pinkMat);
    leftInner.position.set(-0.2, 1.25, 0.08);
    leftInner.rotation.z = 0.15;
    group.add(leftInner);

    const rightInner = new THREE.Mesh(innerEarGeom, pinkMat);
    rightInner.position.set(0.2, 1.25, 0.08);
    rightInner.rotation.z = -0.15;
    group.add(rightInner);

    // 4. Cat Eyes (cute dark beads)
    const eyeGeom = new THREE.BoxGeometry(0.08, 0.09, 0.05);
    const leftEye = new THREE.Mesh(eyeGeom, darkMat);
    leftEye.position.set(-0.16, 0.98, 0.26);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, darkMat);
    rightEye.position.set(0.16, 0.98, 0.26);
    group.add(rightEye);

    // Nose
    const noseGeom = new THREE.BoxGeometry(0.08, 0.06, 0.06);
    const nose = new THREE.Mesh(noseGeom, pinkMat);
    nose.position.set(0, 0.9, 0.27);
    group.add(nose);

    // 5. Tail
    const tailGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 5);
    const tail = new THREE.Mesh(tailGeom, accentMat);
    tail.position.set(0, 0.45, -0.32);
    tail.rotation.x = -Math.PI / 3;
    tail.name = 'cat_tail';
    group.add(tail);

    // 6. Feet (Paws)
    const pawGeom = new THREE.BoxGeometry(0.16, 0.12, 0.22);
    const p1 = new THREE.Mesh(pawGeom, whiteMat);
    p1.position.set(-0.16, 0.06, 0.1);
    group.add(p1);

    const p2 = new THREE.Mesh(pawGeom, whiteMat);
    p2.position.set(0.16, 0.06, 0.1);
    group.add(p2);

    // 7. Role-specific visual Props
    if (role === 'farmer') {
      // Straw Hat
      const hatBrim = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 8);
      const brimMesh = new THREE.Mesh(hatBrim, this.getMaterial(0xd97706, 0.8));
      brimMesh.position.set(0, 1.22, 0);
      group.add(brimMesh);

      const hatTop = new THREE.CylinderGeometry(0.24, 0.28, 0.2, 8);
      const topMesh = new THREE.Mesh(hatTop, this.getMaterial(0xb45309, 0.8));
      topMesh.position.set(0, 1.34, 0);
      group.add(topMesh);
    } else if (role === 'worker') {
      // Safety yellow hard hat
      const helmet = new THREE.SphereGeometry(0.34, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const helmetMesh = new THREE.Mesh(helmet, this.getMaterial(0xeab308, 0.3));
      helmetMesh.position.set(0, 1.15, 0);
      group.add(helmetMesh);
    } else if (role === 'admin') {
      // Little royal crown or monocle
      const crownGeom = new THREE.CylinderGeometry(0.2, 0.26, 0.16, 5);
      const crownMesh = new THREE.Mesh(crownGeom, this.getMaterial(0xf59e0b, 0.2));
      crownMesh.position.set(0, 1.25, 0);
      group.add(crownMesh);
    } else if (role === 'soldier') {
      // Knight helmet / paw spear
      const spearGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 4);
      const spear = new THREE.Mesh(spearGeom, this.getMaterial(0x71717a, 0.5));
      spear.position.set(0.32, 0.6, 0.15);
      spear.rotation.z = -0.15;
      group.add(spear);

      const spearTip = new THREE.ConeGeometry(0.08, 0.25, 4);
      const tipMesh = new THREE.Mesh(spearTip, this.getMaterial(0xef4444, 0.2));
      tipMesh.position.set(0.32, 1.2, 0.15);
      group.add(tipMesh);
    }

    group.scale.set(0.85, 0.85, 0.85);
    return group;
  }

  /**
   * Generates low-poly architectural buildings
   */
  public static createBuildingMesh(type: BuildingType): THREE.Group {
    const group = new THREE.Group();
    const config = BUILDING_CONFIGS[type];
    const mainMat = this.getMaterial(config.color, 0.4);
    const accentMat = this.getMaterial(config.accentColor, 0.3);
    const woodMat = this.getMaterial(0x78350f, 0.7);
    const stoneMat = this.getMaterial(0x64748b, 0.6);
    const goldMat = this.getMaterial(0xfbbf24, 0.2);
    const whiteMat = this.getMaterial(0xf8fafc, 0.3);
    const greenMat = this.getMaterial(0x22c55e, 0.8);

    const baseWidth = config.width * 2;
    const baseDepth = config.height * 2;

    // Foundation Cobblestone Slab
    const foundationGeom = new THREE.BoxGeometry(baseWidth - 0.2, 0.3, baseDepth - 0.2);
    const foundation = new THREE.Mesh(foundationGeom, stoneMat);
    foundation.position.y = 0.15;
    foundation.receiveShadow = true;
    foundation.castShadow = true;
    group.add(foundation);

    switch (type) {
      case 'town_hall': {
        // Grand feline palace with cat ear arches & clock
        const mainFloor = new THREE.Mesh(
          new THREE.BoxGeometry(baseWidth - 0.8, 1.8, baseDepth - 0.8),
          mainMat
        );
        mainFloor.position.y = 1.05;
        mainFloor.castShadow = true;
        group.add(mainFloor);

        // Second tier tower
        const tower = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 2.2, 2.4),
          accentMat
        );
        tower.position.y = 2.9;
        tower.castShadow = true;
        group.add(tower);

        // Cat Ear Roof
        const roofGeom = new THREE.ConeGeometry(1.9, 1.6, 4);
        roofGeom.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofGeom, goldMat);
        roof.position.y = 4.6;
        roof.castShadow = true;
        group.add(roof);

        // Grand Paw Emblem on facade
        const emblemGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12);
        emblemGeom.rotateX(Math.PI / 2);
        const emblem = new THREE.Mesh(emblemGeom, goldMat);
        emblem.position.set(0, 3.2, 1.25);
        group.add(emblem);

        // Golden Pillars
        const pillarGeom = new THREE.CylinderGeometry(0.18, 0.22, 1.8, 8);
        const pL = new THREE.Mesh(pillarGeom, whiteMat);
        pL.position.set(-1.8, 1.05, 1.8);
        const pR = new THREE.Mesh(pillarGeom, whiteMat);
        pR.position.set(1.8, 1.05, 1.8);
        group.add(pL, pR);
        break;
      }

      case 'cat_house': {
        // Cute cozy cottage with pitched roof and chimney
        const houseBody = new THREE.Mesh(
          new THREE.BoxGeometry(baseWidth - 0.6, 1.4, baseDepth - 0.6),
          mainMat
        );
        houseBody.position.y = 0.85;
        houseBody.castShadow = true;
        group.add(houseBody);

        // Pitched Roof
        const roofGeom = new THREE.ConeGeometry(2.2, 1.2, 4);
        roofGeom.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofGeom, accentMat);
        roof.position.y = 2.0;
        roof.castShadow = true;
        group.add(roof);

        // Chimney
        const chimney = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.9, 0.4),
          stoneMat
        );
        chimney.position.set(0.8, 2.2, -0.5);
        group.add(chimney);

        // Round cat door (Paw-shaped entrance)
        const doorGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8);
        doorGeom.rotateX(Math.PI / 2);
        const door = new THREE.Mesh(doorGeom, woodMat);
        door.position.set(0, 0.45, (baseDepth - 0.6) / 2 + 0.02);
        group.add(door);
        break;
      }

      case 'farm': {
        // Plot of cultivated fur/catnip & fish pond
        const pondGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 8);
        const pond = new THREE.Mesh(pondGeom, this.getMaterial(0x38bdf8, 0.1));
        pond.position.set(-0.8, 0.25, -0.6);
        group.add(pond);

        // Catnip crops rows
        for (let row = -1; row <= 1; row++) {
          const rowMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.25, 0.45),
            this.getMaterial(0x713f12, 0.9)
          );
          rowMesh.position.set(0.7, 0.25, row * 0.75);
          group.add(rowMesh);

          // Green sprouts
          for (let s = -0.5; s <= 0.5; s += 0.5) {
            const sprout = new THREE.Mesh(
              new THREE.ConeGeometry(0.18, 0.4, 4),
              greenMat
            );
            sprout.position.set(0.7 + s, 0.55, row * 0.75);
            group.add(sprout);
          }
        }

        // Small wooden tool shed
        const shed = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 1.0, 0.9),
          woodMat
        );
        shed.position.set(-0.9, 0.7, 0.8);
        shed.castShadow = true;
        group.add(shed);
        break;
      }

      case 'sawmill': {
        // Timber logs & spinning waterwheel/saw
        const millBuilding = new THREE.Mesh(
          new THREE.BoxGeometry(baseWidth - 0.8, 1.4, baseDepth - 1.2),
          mainMat
        );
        millBuilding.position.set(-0.3, 0.85, 0);
        millBuilding.castShadow = true;
        group.add(millBuilding);

        // Stacked timber logs
        for (let i = 0; i < 3; i++) {
          const logGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.8, 6);
          logGeom.rotateZ(Math.PI / 2);
          const log = new THREE.Mesh(logGeom, woodMat);
          log.position.set(1.1, 0.35 + (i > 1 ? 0.3 : 0), (i % 2 === 0 ? -0.3 : 0.3));
          group.add(log);
        }

        // Circular Saw Blade
        const sawGeom = new THREE.CylinderGeometry(0.65, 0.65, 0.05, 12);
        sawGeom.rotateX(Math.PI / 2);
        const saw = new THREE.Mesh(sawGeom, this.getMaterial(0x94a3b8, 0.2));
        saw.position.set(0.8, 0.7, 0);
        group.add(saw);
        break;
      }

      case 'quarry': {
        // Rocky excavation pit with crane and cart
        const stoneBlocks = [
          { s: [0.9, 0.8, 0.9], p: [-0.8, 0.55, -0.6] },
          { s: [1.2, 0.9, 1.0], p: [0.6, 0.6, 0.4] },
          { s: [0.7, 0.6, 0.7], p: [-0.6, 0.45, 0.8] },
        ];

        for (const block of stoneBlocks) {
          const b = new THREE.Mesh(
            new THREE.BoxGeometry(block.s[0], block.s[1], block.s[2]),
            stoneMat
          );
          b.position.set(block.p[0], block.p[1], block.p[2]);
          b.castShadow = true;
          group.add(b);
        }

        // Wooden lifting crane post
        const cranePole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.14, 2.4, 6),
          woodMat
        );
        cranePole.position.set(0.8, 1.25, -0.8);
        cranePole.castShadow = true;
        group.add(cranePole);

        const craneArm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6),
          woodMat
        );
        craneArm.position.set(0.2, 2.3, -0.8);
        craneArm.rotation.z = Math.PI / 2;
        group.add(craneArm);
        break;
      }

      case 'workshop': {
        // Forge & gear workshop with steaming smokestack
        const factory = new THREE.Mesh(
          new THREE.BoxGeometry(baseWidth - 0.7, 1.5, baseDepth - 0.7),
          mainMat
        );
        factory.position.y = 0.9;
        factory.castShadow = true;
        group.add(factory);

        // High chimney / smokestack
        const stackGeom = new THREE.CylinderGeometry(0.3, 0.4, 2.2, 8);
        const stack = new THREE.Mesh(stackGeom, this.getMaterial(0x334155, 0.4));
        stack.position.set(-0.9, 1.8, -0.8);
        stack.castShadow = true;
        group.add(stack);

        // Big gear decoration
        const gearGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 8);
        gearGeom.rotateX(Math.PI / 2);
        const gear = new THREE.Mesh(gearGeom, goldMat);
        gear.position.set(0, 1.2, (baseDepth - 0.7) / 2 + 0.05);
        group.add(gear);
        break;
      }

      case 'barracks': {
        // Fortified outpost with guard towers and red flag
        const wallGeom = new THREE.BoxGeometry(baseWidth - 0.6, 1.3, baseDepth - 0.6);
        const wall = new THREE.Mesh(wallGeom, mainMat);
        wall.position.y = 0.8;
        wall.castShadow = true;
        group.add(wall);

        // Four corner towers
        const offsets = [-1.3, 1.3];
        for (const ox of offsets) {
          for (const oz of offsets) {
            const tower = new THREE.Mesh(
              new THREE.CylinderGeometry(0.35, 0.4, 1.9, 6),
              stoneMat
            );
            tower.position.set(ox, 1.1, oz);
            tower.castShadow = true;
            group.add(tower);
          }
        }

        // Paw Flagpole
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 2.2, 5),
          this.getMaterial(0x94a3b8, 0.3)
        );
        pole.position.set(0, 1.8, 0);
        group.add(pole);

        const flag = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.45, 0.04),
          accentMat
        );
        flag.position.set(0.35, 2.5, 0);
        group.add(flag);
        break;
      }
    }

    return group;
  }

  /**
   * Transparent ghost preview for building placement
   */
  public static createPlacementGhost(type: BuildingType, isValid: boolean = true): THREE.Group {
    const mesh = this.createBuildingMesh(type);
    const color = isValid ? 0x22c55e : 0xef4444;

    mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.55,
          wireframe: false,
        });
      }
    });

    return mesh;
  }
}
