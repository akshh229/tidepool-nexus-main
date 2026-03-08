import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const MODULE_COLORS = {
  input:    0xcccccc,
  chemo:    0x44ff44,
  value:    0xffcc00,
  predator: 0xff4444,
  shelter:  0x4488ff,
  motor:    0xcc44ff
};

const MODULE_LAYER_Z = {
  input: 0, chemo: 8, value: 16, predator: 24, shelter: 32, motor: 40
};

export class BrainView {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.composer = null;
    this.neuronMeshes = [];
    this.connectionLines = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this._hoveredId = -1;
    this._highlightModule = null;
    this._positionsAssigned = false;
    this._neuronGroup = null;
    this._connGroup = null;
  }

  init(network) {
    const w = this.canvas.clientWidth || 600;
    const h = this.canvas.clientHeight || 600;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x050510);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
    this.camera.position.set(0, -30, 50);
    this.camera.lookAt(0, 0, 20);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, 0, 20);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.update();

    // Lights
    this.scene.add(new THREE.AmbientLight(0x222244, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(10, -10, 30);
    this.scene.add(dirLight);

    // Post-processing — bloom
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h), 0.6, 0.4, 0.7
    );
    this.composer.addPass(bloomPass);

    // Groups
    this._neuronGroup = new THREE.Group();
    this._connGroup = new THREE.Group();
    this.scene.add(this._connGroup);
    this.scene.add(this._neuronGroup);

    // Build initial meshes from network
    this._buildFromNetwork(network);

    // Mouse events for raycasting
    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this._doRaycast('neuronHover');
    };
    this._onClick = () => {
      this._doRaycast('neuronClick');
    };
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('click', this._onClick);

    // Resize
    this._onResize = () => {
      const cw = this.canvas.clientWidth;
      const ch = this.canvas.clientHeight;
      if (cw === 0 || ch === 0) return;
      this.renderer.setSize(cw, ch);
      this.camera.aspect = cw / ch;
      this.camera.updateProjectionMatrix();
      this.composer.setSize(cw, ch);
    };
    window.addEventListener('resize', this._onResize);

    // Gap 5: Lovable panel resize events
    this._onContainerResized = (e) => {
      const { width, height } = e.detail;
      if (!width || !height) return;
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.composer.setSize(width, height);
    };
    this.canvas.addEventListener('containerResized', this._onContainerResized);
  }

  _buildFromNetwork(network) {
    const snapshot = network.getSnapshot();
    this._buildNeurons(snapshot.neurons);
    this._buildConnections(snapshot.connections, snapshot.neurons);
  }

  _assignPositions(neurons) {
    // Group by module and spread in circular layers
    const groups = {};
    for (const n of neurons) {
      if (!groups[n.module]) groups[n.module] = [];
      groups[n.module].push(n);
    }
    for (const [mod, ns] of Object.entries(groups)) {
      const z = MODULE_LAYER_Z[mod] ?? 20;
      const count = ns.length;
      const radius = Math.max(5, count * 0.5);
      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count;
        ns[i].position3D = {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          z
        };
      }
    }
  }

  _buildNeurons(neurons) {
    // Check if positions need assignment (all at origin)
    const allOrigin = neurons.every(n => !n.position3D || (n.position3D.x === 0 && n.position3D.y === 0 && n.position3D.z === 0));
    if (allOrigin) this._assignPositions(neurons);

    const geo = new THREE.SphereGeometry(0.4, 10, 8);
    this.neuronMeshes = [];
    for (const n of neurons) {
      const color = MODULE_COLORS[n.module] || 0x888888;
      const mat = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 1.0
      });
      const mesh = new THREE.Mesh(geo, mat);
      const p = n.position3D;
      mesh.position.set(p.x, p.y, p.z);
      mesh.userData = { neuronId: n.id, module: n.module, type: n.type };
      this._neuronGroup.add(mesh);
      this.neuronMeshes.push(mesh);
    }
  }

  _buildConnections(connections, neurons) {
    const posByNeuronId = {};
    for (const n of neurons) posByNeuronId[n.id] = n.position3D;

    // Clear old
    for (const l of this.connectionLines) {
      l.geometry.dispose();
      l.material.dispose();
    }
    this._connGroup.clear();
    this.connectionLines = [];

    for (const c of connections) {
      const from = posByNeuronId[c.fromId];
      const to = posByNeuronId[c.toId];
      if (!from || !to) continue;

      const absW = Math.abs(c.weight);
      const color = c.weight >= 0 ? 0x44ff88 : 0xff4466;
      const pts = [new THREE.Vector3(from.x, from.y, from.z), new THREE.Vector3(to.x, to.y, to.z)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: Math.min(0.8, absW * 0.4),
        linewidth: 1
      });
      const line = new THREE.Line(geo, mat);
      line.userData = { connIdx: c.idx };
      this._connGroup.add(line);
      this.connectionLines.push(line);
    }
  }

  _doRaycast(eventType) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.neuronMeshes);
    if (hits.length > 0) {
      const nid = hits[0].object.userData.neuronId;
      if (eventType === 'neuronHover' && nid !== this._hoveredId) {
        if (this._hoveredId >= 0) {
          this.canvas.dispatchEvent(new CustomEvent('neuronLeave', { detail: { neuronId: this._hoveredId } }));
        }
        this._hoveredId = nid;
        this.canvas.dispatchEvent(new CustomEvent(eventType, { detail: hits[0].object.userData }));
      } else if (eventType === 'neuronClick') {
        this.canvas.dispatchEvent(new CustomEvent(eventType, { detail: hits[0].object.userData }));
      }
    } else if (this._hoveredId >= 0) {
      this.canvas.dispatchEvent(new CustomEvent('neuronLeave', { detail: { neuronId: this._hoveredId } }));
      this._hoveredId = -1;
    }
  }

  setModuleHighlight(moduleName) {
    this._highlightModule = moduleName;
    for (const mesh of this.neuronMeshes) {
      const isTarget = !moduleName || mesh.userData.module === moduleName;
      mesh.material.opacity = isTarget ? 1.0 : 0.15;
      mesh.material.emissiveIntensity = isTarget ? 0.5 : 0.05;
    }
    for (const line of this.connectionLines) {
      line.material.opacity = moduleName ? 0.05 : Math.min(0.8, line.material.opacity);
    }
  }

  update(snapshot) {
    if (!snapshot) return;
    // Update neuron glow by output activity
    for (const nData of snapshot.neurons) {
      const mesh = this.neuronMeshes[nData.id];
      if (!mesh) continue;
      const act = Math.abs(nData.output);
      mesh.material.emissiveIntensity = 0.1 + act * 0.8;
      mesh.scale.setScalar(0.8 + act * 0.6);
    }
  }

  render() {
    if (!this.composer) return;
    this.controls.update();
    this.composer.render();
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('containerResized', this._onContainerResized);
    this.controls?.dispose();
    this.composer?.dispose();
    this.renderer?.dispose();
  }
}
