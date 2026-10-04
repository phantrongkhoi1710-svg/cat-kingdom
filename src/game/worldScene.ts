import * as THREE from 'three';
import { GRID_SIZE, TILE_SIZE } from './constants';

export class WorldScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private groundMesh: THREE.Mesh;
  private gridHelper: THREE.GridHelper;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;

  // Camera pan/zoom target controls
  public cameraTarget: THREE.Vector3 = new THREE.Vector3(
    (GRID_SIZE * TILE_SIZE) / 2,
    0,
    (GRID_SIZE * TILE_SIZE) / 2
  );
  public cameraDistance: number = 42;
  public cameraAngle: number = Math.PI / 4; // 45 deg isometric perspective
  public cameraElevation: number = 0.85;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private isRightDragging: boolean = false;

  constructor(container: HTMLElement) {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbbf7d0); // Soft pastel pasture
    this.scene.fog = new THREE.FogExp2(0xbbf7d0, 0.008);

    // 2. Camera (Isometric-angled Perspective)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.5, 300);
    this.updateCameraPosition();

    // 3. Renderer with soft shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 4. Lighting & Day/Night Setup
    this.ambientLight = new THREE.AmbientLight(0xfffbeb, 0.6);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x15803d, 0.5);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    this.dirLight.position.set(40, 60, 30);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 150;
    const d = 50;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // 5. Procedural Ground (Island / Meadow)
    const worldTotalSize = GRID_SIZE * TILE_SIZE;
    const groundGeom = new THREE.PlaneGeometry(worldTotalSize, worldTotalSize, 64, 64);
    groundGeom.rotateX(-Math.PI / 2);

    // Subtle grass color vertex styling
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x86efac,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
    });
    this.groundMesh = new THREE.Mesh(groundGeom, groundMat);
    this.groundMesh.position.set(worldTotalSize / 2 - TILE_SIZE / 2, -0.01, worldTotalSize / 2 - TILE_SIZE / 2);
    this.groundMesh.receiveShadow = true;
    this.groundMesh.name = 'ground';
    this.scene.add(this.groundMesh);

    // Gentle Grid Lines
    this.gridHelper = new THREE.GridHelper(worldTotalSize, GRID_SIZE, 0x16a34a, 0x4ade80);
    this.gridHelper.position.set(worldTotalSize / 2 - TILE_SIZE / 2, 0.01, worldTotalSize / 2 - TILE_SIZE / 2);
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.25;
    this.scene.add(this.gridHelper);

    // 6. Natural Environment decorations (Cute stylized low-poly trees & stones)
    this.generateSurroundingNature();

    // 7. Event listeners
    this.setupControls(container);
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private generateSurroundingNature(): void {
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6, flatShading: true });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, flatShading: true });

    // Place trees around peripheral tiles
    for (let i = 0; i < 45; i++) {
      let x = Math.floor(Math.random() * GRID_SIZE);
      let z = Math.floor(Math.random() * GRID_SIZE);

      // Only on edges
      if (x > 3 && x < GRID_SIZE - 4 && z > 3 && z < GRID_SIZE - 4) {
        if (Math.random() > 0.15) continue;
      }

      const worldX = x * TILE_SIZE;
      const worldZ = z * TILE_SIZE;

      if (Math.random() > 0.3) {
        // Tree
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.8, 5), trunkMat);
        trunk.position.y = 0.4;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 5), treeMat);
        foliage.position.y = 1.6;
        foliage.castShadow = true;
        treeGroup.add(foliage);

        treeGroup.position.set(worldX + (Math.random() - 0.5), 0, worldZ + (Math.random() - 0.5));
        const s = 0.7 + Math.random() * 0.6;
        treeGroup.scale.set(s, s, s);
        this.scene.add(treeGroup);
      } else {
        // Rock
        const rockGeom = new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.4, 0);
        const rock = new THREE.Mesh(rockGeom, rockMat);
        rock.position.set(worldX, 0.2, worldZ);
        rock.castShadow = true;
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        this.scene.add(rock);
      }
    }
  }

  public updateDayNightVisuals(dayTime: number): void {
    // 0 = midnight, 0.25 = sunrise, 0.5 = midday noon, 0.75 = sunset
    const sunAngle = dayTime * Math.PI * 2 - Math.PI / 2;
    const sunHeight = Math.sin(sunAngle);

    // Position sun
    this.dirLight.position.x = this.cameraTarget.x + Math.cos(sunAngle) * 60;
    this.dirLight.position.y = Math.max(10, sunHeight * 70);
    this.dirLight.position.z = this.cameraTarget.z + 30;

    if (sunHeight > 0) {
      // Day time
      const dayFactor = Math.min(1, sunHeight * 1.5);
      this.dirLight.intensity = 0.4 + dayFactor * 1.0;
      this.ambientLight.intensity = 0.3 + dayFactor * 0.4;

      // Golden sunset / warm morning tinge
      if (sunHeight < 0.35) {
        this.scene.background = new THREE.Color(0xfde68a); // Sunset glow
        this.scene.fog?.color.set(0xfde68a);
        this.dirLight.color.set(0xfb923c);
      } else {
        this.scene.background = new THREE.Color(0xbae6fd); // Clear blue daytime sky
        this.scene.fog?.color.set(0xbae6fd);
        this.dirLight.color.set(0xfff7ed);
      }
    } else {
      // Night time
      this.dirLight.intensity = 0.15;
      this.dirLight.color.set(0x818cf8); // Moonlight
      this.ambientLight.intensity = 0.15;
      this.scene.background = new THREE.Color(0x0f172a); // Deep starry navy
      this.scene.fog?.color.set(0x0f172a);
    }
  }

  public updateCameraPosition(): void {
    const x = this.cameraTarget.x + Math.cos(this.cameraAngle) * this.cameraDistance;
    const z = this.cameraTarget.z + Math.sin(this.cameraAngle) * this.cameraDistance;
    const y = this.cameraTarget.y + this.cameraDistance * this.cameraElevation;

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  private setupControls(container: HTMLElement): void {
    container.addEventListener('mousedown', (e) => {
      if (e.button === 1 || e.button === 2 || e.shiftKey) {
        // Middle button or right button or Shift+Left for panning/rotating
        this.isRightDragging = e.button === 2;
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;

      if (this.isRightDragging) {
        // Orbit rotation around center
        this.cameraAngle += dx * 0.005;
        this.updateCameraPosition();
      } else {
        // Pan ground target
        const factor = (this.cameraDistance / 60) * 0.05;
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(this.camera.up, forward).normalize();

        this.cameraTarget.addScaledVector(right, dx * factor);
        this.cameraTarget.addScaledVector(forward, dy * factor);

        // Clamp inside bounds
        const maxBound = GRID_SIZE * TILE_SIZE;
        this.cameraTarget.x = Math.max(0, Math.min(maxBound, this.cameraTarget.x));
        this.cameraTarget.z = Math.max(0, Math.min(maxBound, this.cameraTarget.z));

        this.updateCameraPosition();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.isRightDragging = false;
    });

    // Zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance += e.deltaY * 0.04;
      this.cameraDistance = Math.max(16, Math.min(95, this.cameraDistance));
      this.updateCameraPosition();
    }, { passive: false });

    // Keyboard Pan
    window.addEventListener('keydown', (e) => {
      const step = 2.5;
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3().crossVectors(this.camera.up, forward).normalize();

      if (e.key === 'w' || e.key === 'ArrowUp') this.cameraTarget.addScaledVector(forward, step);
      if (e.key === 's' || e.key === 'ArrowDown') this.cameraTarget.addScaledVector(forward, -step);
      if (e.key === 'a' || e.key === 'ArrowLeft') this.cameraTarget.addScaledVector(right, step);
      if (e.key === 'd' || e.key === 'ArrowRight') this.cameraTarget.addScaledVector(right, -step);
      if (e.key === 'q') this.cameraAngle -= 0.1;
      if (e.key === 'e') this.cameraAngle += 0.1;

      this.updateCameraPosition();
    });
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public getGroundIntersection(mouseScreenX: number, mouseScreenY: number): THREE.Vector3 | null {
    const mouse = new THREE.Vector2(
      (mouseScreenX / window.innerWidth) * 2 - 1,
      -(mouseScreenY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObject(this.groundMesh);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }

  public getIntersectedObject(mouseScreenX: number, mouseScreenY: number): THREE.Object3D | null {
    const mouse = new THREE.Vector2(
      (mouseScreenX / window.innerWidth) * 2 - 1,
      -(mouseScreenY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(this.scene.children, true);
    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr !== this.scene) {
        if (curr.userData && curr.userData.id) {
          return curr;
        }
        curr = curr.parent;
      }
    }
    return null;
  }
}
