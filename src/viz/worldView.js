import * as THREE from 'three';
import { WORLD } from '../sim/world.js';

const FOOD_COLORS = {
  A: 0xff4444, B: 0x44ff44, C: 0x4488ff, D: 0xffdd44
};
const MODULE_COLORS = {
  input: 0xcccccc, chemo: 0x44ff44, value: 0xffcc00,
  predator: 0xff4444, shelter: 0x4488ff, motor: 0xcc44ff
};

export class WorldView {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.creatureMesh = null;
    this.trailPoints = [];
    this.trailLine = null;
    this.foodMeshes = {};
    this.predMeshes = [];
    this.shelterMeshes = [];
    this.ambientLight = null;
    this.shelterLights = [];
    this.groundMesh = null;
    this._prevCreaturePos = null;
  }

  init() {
    const w = this.canvas.clientWidth || 600;
    const h = this.canvas.clientHeight || 600;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a1a);

    this.scene = new THREE.Scene();

    // Orthographic camera — top-down view of 100×100 world
    const aspect = w / h;
    const halfW = WORLD.SIZE / 2;
    const halfH = halfW / aspect;
    this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 200);
    this.camera.position.set(WORLD.SIZE / 2, WORLD.SIZE / 2, 100);
    this.camera.lookAt(WORLD.SIZE / 2, WORLD.SIZE / 2, 0);

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffeedd, 0.3);
    dirLight.position.set(50, 50, 80);
    this.scene.add(dirLight);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(WORLD.SIZE, WORLD.SIZE);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0d1b2a });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.position.set(WORLD.SIZE / 2, WORLD.SIZE / 2, -0.1);
    this.scene.add(this.groundMesh);

    // Grid
    const gridHelper = new THREE.GridHelper(WORLD.SIZE, 20, 0x1b2838, 0x1b2838);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.set(WORLD.SIZE / 2, WORLD.SIZE / 2, 0);
    this.scene.add(gridHelper);

    // Creature — cone pointing in heading direction
    const coneGeo = new THREE.ConeGeometry(1.2, 3, 8);
    coneGeo.rotateZ(-Math.PI / 2); // point along +X by default
    const coneMat = new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x004433 });
    this.creatureMesh = new THREE.Mesh(coneGeo, coneMat);
    this.creatureMesh.position.z = 1;
    this.scene.add(this.creatureMesh);

    // Trail line
    const trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.LineBasicMaterial({ color: 0x00ffcc, opacity: 0.3, transparent: true });
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    this.trailLine.position.z = 0.5;
    this.scene.add(this.trailLine);

    // Food meshes — pre-create pools
    const foodGeo = new THREE.SphereGeometry(0.6, 8, 6);
    for (const type of WORLD.FOOD_TYPES) {
      this.foodMeshes[type] = [];
      const mat = new THREE.MeshPhongMaterial({
        color: FOOD_COLORS[type], emissive: FOOD_COLORS[type],
        emissiveIntensity: 0.3, transparent: true
      });
      for (let i = 0; i < WORLD.FOOD_COUNT; i++) {
        const mesh = new THREE.Mesh(foodGeo, mat.clone());
        mesh.position.z = 0.6;
        this.scene.add(mesh);
        this.foodMeshes[type].push(mesh);
      }
    }

    // Predator meshes
    const predGeo = new THREE.OctahedronGeometry(1.5);
    const predMat = new THREE.MeshPhongMaterial({ color: 0xff2222, emissive: 0x660000 });
    for (let i = 0; i < WORLD.PREDATOR_COUNT; i++) {
      const mesh = new THREE.Mesh(predGeo, predMat.clone());
      mesh.position.z = 1.5;
      this.scene.add(mesh);
      this.predMeshes.push(mesh);
    }

    // Shelter meshes — translucent domes
    const shelterGeo = new THREE.SphereGeometry(WORLD.SHELTER_RADIUS, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const shelterMat = new THREE.MeshPhongMaterial({
      color: 0x4488cc, transparent: true, opacity: 0.2,
      emissive: 0x224466, side: THREE.DoubleSide
    });
    for (let i = 0; i < WORLD.SHELTER_COUNT; i++) {
      const mesh = new THREE.Mesh(shelterGeo, shelterMat.clone());
      this.scene.add(mesh);
      this.shelterMeshes.push(mesh);
      // Amber point light for night
      const light = new THREE.PointLight(0xe8a838, 0, 15);
      light.position.z = 2;
      mesh.add(light);
      this.shelterLights.push(light);
    }

    // Handle resize
    this._onResize = () => {
      const cw = this.canvas.clientWidth;
      const ch = this.canvas.clientHeight;
      if (cw === 0 || ch === 0) return;
      this.renderer.setSize(cw, ch);
      const a = cw / ch;
      const hW = WORLD.SIZE / 2;
      const hH = hW / a;
      this.camera.left = -hW;
      this.camera.right = hW;
      this.camera.top = hH;
      this.camera.bottom = -hH;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', this._onResize);

    // Gap 5: Lovable panel resize events
    this._onContainerResized = (e) => {
      const { width, height } = e.detail;
      if (!width || !height) return;
      this.renderer.setSize(width, height);
      const a = width / height;
      const hW = WORLD.SIZE / 2;
      const hH = hW / a;
      this.camera.left = -hW;
      this.camera.right = hW;
      this.camera.top = hH;
      this.camera.bottom = -hH;
      this.camera.updateProjectionMatrix();
    };
    this.canvas.addEventListener('containerResized', this._onContainerResized);
  }

  update(state) {
    if (!state) return;
    const { creature, foods, predators, shelters, daylight, isNight, step } = state;

    // Creature position and heading
    this.creatureMesh.position.set(creature.x, creature.y, 1);
    this.creatureMesh.rotation.z = creature.theta;

    // Trail — skip if torus wrap (delta > 50)
    const cp = { x: creature.x, y: creature.y };
    if (this._prevCreaturePos) {
      const dx = Math.abs(cp.x - this._prevCreaturePos.x);
      const dy = Math.abs(cp.y - this._prevCreaturePos.y);
      if (dx < 50 && dy < 50) {
        this.trailPoints.push(new THREE.Vector3(cp.x, cp.y, 0));
      }
    }
    this._prevCreaturePos = cp;
    if (this.trailPoints.length > 500) this.trailPoints.splice(0, this.trailPoints.length - 500);
    if (this.trailPoints.length > 1) {
      this.trailLine.geometry.dispose();
      this.trailLine.geometry = new THREE.BufferGeometry().setFromPoints(this.trailPoints);
    }

    // Food
    for (const type of WORLD.FOOD_TYPES) {
      const srcs = foods[type] || [];
      for (let i = 0; i < this.foodMeshes[type].length; i++) {
        const mesh = this.foodMeshes[type][i];
        if (i < srcs.length && srcs[i].alive) {
          mesh.visible = true;
          mesh.position.set(srcs[i].x, srcs[i].y, 0.6);
          // Pulse opacity
          const pulse = 0.5 + 0.5 * Math.sin(step * 0.1 + i);
          mesh.material.opacity = 0.5 + 0.4 * pulse;
        } else {
          mesh.visible = false;
        }
      }
    }

    // Predators
    for (let i = 0; i < this.predMeshes.length; i++) {
      if (i < predators.length) {
        this.predMeshes[i].visible = true;
        this.predMeshes[i].position.set(predators[i].x, predators[i].y, 1.5);
        this.predMeshes[i].rotation.y += 0.03;
      } else {
        this.predMeshes[i].visible = false;
      }
    }

    // Shelters
    for (let i = 0; i < this.shelterMeshes.length; i++) {
      if (i < shelters.length) {
        this.shelterMeshes[i].position.set(shelters[i].x, shelters[i].y, 0);
        // Night amber light
        this.shelterLights[i].intensity = isNight ? 0.8 : 0;
      }
    }

    // Day/night lighting
    const dl = Math.max(daylight, 0);
    this.ambientLight.intensity = 0.1 + 0.6 * dl;
    this.renderer.setClearColor(
      new THREE.Color().setHSL(0.62, 0.3, 0.02 + 0.08 * dl)
    );
  }

  render() {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('containerResized', this._onContainerResized);
    this.renderer?.dispose();
  }
}
