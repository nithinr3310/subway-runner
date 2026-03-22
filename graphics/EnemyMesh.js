import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { LANE_X } from '../game/WorldConfig.js';

/**
 * Chaser visuals — GLTF when available, else a procedural 4-rotor attack drone
 * with a forward-facing scanning laser eye and engine exhaust glow.
 */
export default class EnemyMesh {

  /**
   * @param {THREE.Scene} scene
   * @param {{ chaserGltf?: import('three/examples/jsm/loaders/GLTFLoader.js').GLTF } | null} assets
   */
  constructor(scene, assets = null) {
    this._group = new THREE.Group();
    this._group.position.set(LANE_X[1], 0, -28);

    this._useGltf       = false;
    this._rotorBlades   = []; // all rotor blade meshes
    this._exhaustMeshes = []; // thruster glow cones
    this._scanEye       = null;
    this._rotorPhase    = Math.random() * Math.PI * 2;

    if (assets?.chaserGltf?.scene) {
      const root = SkeletonUtils.clone(assets.chaserGltf.scene);
      this._setupChaserModel(root);
      this._group.add(root);
      this._modelRoot = root;
      this._useGltf = true;
    } else {
      this._buildDrone();
    }

    // Central pulsing red glow
    this._glow = new THREE.PointLight(0xff2244, 3.0, 9);
    this._glow.position.set(0, 0.9, 0.3);
    this._group.add(this._glow);

    scene.add(this._group);
  }

  // ── GLTF path (unchanged) ─────────────────────────────────────────────────

  _setupChaserModel(root) {
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        if (o.material && !Array.isArray(o.material)) {
          const m = o.material.clone();
          m.color             = new THREE.Color(0x331122);
          m.emissive          = new THREE.Color(0xff1144);
          m.emissiveIntensity = 0.85;
          m.metalness         = 0.75;
          m.roughness         = 0.35;
          o.material = m;
        }
      }
    });

    const box  = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const s    = 1.0 / Math.max(size.x, size.y, size.z, 0.001);
    root.scale.setScalar(s);

    const box2 = new THREE.Box3().setFromObject(root);
    root.position.y = -box2.min.y + 0.15;
    root.rotation.y = Math.PI;
  }

  // ── Procedural 4-Rotor Attack Drone ──────────────────────────────────────

  _buildDrone() {

    // ── Materials ──────────────────────────────────────────────────────────
    const bodyMat = new THREE.MeshStandardMaterial({
      color:             0x1a0a1e,
      emissive:          new THREE.Color(0x440011),
      emissiveIntensity: 0.6,
      roughness:         0.30,
      metalness:         0.80,
    });

    const redGlowMat = new THREE.MeshStandardMaterial({
      color:             0xff0000,
      emissive:          new THREE.Color(0xff2244),
      emissiveIntensity: 2.5,
      roughness:         0.1,
      metalness:         0.5,
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color:     0x050005,
      roughness: 0.4,
      metalness: 0.9,
    });

    const rotorMat = new THREE.MeshBasicMaterial({ color: 0xff4466 });

    // ── Body: hex prism (CylinderGeometry 6-sided, squashed) ──────────────
    const bodyGeo  = new THREE.CylinderGeometry(0.52, 0.48, 0.34, 6);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.90;
    bodyMesh.rotation.y = Math.PI / 6;
    bodyMesh.castShadow = true;
    this._group.add(bodyMesh);

    // Under-belly detail panels
    const panelGeo  = new THREE.BoxGeometry(0.55, 0.08, 0.55);
    const panelMesh = new THREE.Mesh(panelGeo, darkMat.clone());
    panelMesh.position.y = 0.76;
    this._group.add(panelMesh);

    // Top sensor dome
    const domeGeo  = new THREE.SphereGeometry(0.20, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMesh = new THREE.Mesh(domeGeo, bodyMat.clone());
    domeMesh.position.y = 1.07;
    this._group.add(domeMesh);

    // ── Forward nose + Scanning Eye ───────────────────────────────────────
    const noseGeo  = new THREE.ConeGeometry(0.14, 0.40, 8);
    const noseMesh = new THREE.Mesh(noseGeo, bodyMat.clone());
    noseMesh.rotation.x = -Math.PI / 2;     // point forward (+Z)
    noseMesh.position.set(0, 0.90, 0.55);
    this._group.add(noseMesh);

    // Scanning eye — small illuminated sphere at nose tip
    const eyeGeo  = new THREE.SphereGeometry(0.10, 10, 8);
    this._scanEye = new THREE.Mesh(eyeGeo, redGlowMat);
    this._scanEye.position.set(0, 0.90, 0.76);
    this._group.add(this._scanEye);

    // Small scan-eye point light (separate from the main glow)
    this._eyeLight = new THREE.PointLight(0xff0000, 2.5, 4);
    this._eyeLight.position.set(0, 0.90, 0.80);
    this._group.add(this._eyeLight);

    // ── 4 Rotor Arms (diagonals: ±45°) ───────────────────────────────────
    const armAngles = [45, -45, 135, -135];
    const armRadius = 0.85; // distance from body center

    for (const angleDeg of armAngles) {
      const rad = THREE.MathUtils.degToRad(angleDeg);
      const ax  = Math.sin(rad) * armRadius;
      const az  = Math.cos(rad) * armRadius;

      // Arm strut
      const strutGeo  = new THREE.BoxGeometry(0.08, 0.06, armRadius * 0.95);
      const strutMesh = new THREE.Mesh(strutGeo, bodyMat.clone());
      strutMesh.position.set(ax * 0.5, 0.92, az * 0.5);
      strutMesh.rotation.y = -rad;
      this._group.add(strutMesh);

      // Rotor hub
      const hubGeo  = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 8);
      const hubMesh = new THREE.Mesh(hubGeo, darkMat.clone());
      hubMesh.position.set(ax, 1.00, az);
      this._group.add(hubMesh);

      // Two blades per rotor
      for (let b = 0; b < 2; b++) {
        const bladeGeo  = new THREE.BoxGeometry(0.50, 0.02, 0.10);
        const bladeMesh = new THREE.Mesh(bladeGeo, rotorMat.clone());
        bladeMesh.position.set(ax, 1.03, az);
        bladeMesh.userData.rotorCenter = new THREE.Vector3(ax, 1.03, az);
        bladeMesh.userData.initialAngle = (b * Math.PI);
        this._rotorBlades.push(bladeMesh);
        this._group.add(bladeMesh);
      }

      // Rotor tip glow pip
      const pipGeo  = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 6);
      const pipMesh = new THREE.Mesh(pipGeo, redGlowMat.clone());
      pipMesh.position.set(ax, 1.05, az);
      this._group.add(pipMesh);
    }

    // ── Rear Engine Exhaust ───────────────────────────────────────────────
    const exhaustMat = new THREE.MeshStandardMaterial({
      color:             0xff6600,
      emissive:          new THREE.Color(0xff4400),
      emissiveIntensity: 2.5,
      roughness:         0.1,
      metalness:         0.3,
      transparent:       true,
      opacity:           0.85,
    });

    for (const ex of [-0.20, 0.20]) {
      const exhaustGeo  = new THREE.ConeGeometry(0.07, 0.28, 6);
      const exhaustMesh = new THREE.Mesh(exhaustGeo, exhaustMat.clone());
      exhaustMesh.rotation.x = Math.PI / 2; // point backward
      exhaustMesh.position.set(ex, 0.90, -0.52);
      this._group.add(exhaustMesh);
      this._exhaustMeshes.push(exhaustMesh);
    }
  }

  // ── Per-frame update ─────────────────────────────────────────────────────

  /**
   * @param {import('../game/ChaserEnemy.js').default} enemy
   * @param {number} dt — ms
   */
  update(enemy, dt) {
    const t        = dt * 0.001;
    const now      = Date.now();
    const bobY     = Math.sin(now * 0.006) * 0.14;

    this._group.position.set(enemy.x, bobY, enemy.z);

    // Main glow pulse
    this._glow.intensity = 2.0 + Math.sin(now * 0.004) * 0.8;

    if (!this._useGltf) {
      // Spin rotors
      this._rotorPhase += t * 42;
      for (const blade of this._rotorBlades) {
        const c    = blade.userData.rotorCenter;
        const init = blade.userData.initialAngle;
        const ang  = this._rotorPhase + init;
        // Offset from rotor center
        blade.position.x = c.x + Math.cos(ang) * 0.25;
        blade.position.z = c.z + Math.sin(ang) * 0.25;
        blade.rotation.y = ang;
      }

      // Scan eye flicker
      if (this._scanEye) {
        const flicker = 2.0 + Math.sin(now * 0.012) * 1.2 + Math.sin(now * 0.071) * 0.4;
        this._scanEye.material.emissiveIntensity = flicker;
        this._eyeLight.intensity = flicker * 0.9;
      }

      // Exhaust pulse
      for (const ex of this._exhaustMeshes) {
        ex.material.emissiveIntensity = 1.8 + Math.sin(now * 0.009 + ex.position.x) * 1.0;
      }

      // Subtle side-to-side rock
      this._group.rotation.z = Math.sin(now * 0.0025) * 0.08;

    } else if (this._modelRoot) {
      this._modelRoot.rotation.y = Math.PI + Math.sin(now * 0.003) * 0.08;
    }
  }
}
