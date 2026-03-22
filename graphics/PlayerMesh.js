import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { PLAYER_Z } from '../game/WorldConfig.js';

export default class PlayerMesh {

  /**
   * @param {THREE.Scene} scene
   * @param {{ playerGltf?: import('three/examples/jsm/loaders/GLTFLoader.js').GLTF } | null} assets
   */
  constructor(scene, assets = null) {

    this._group = new THREE.Group();
    this._group.position.set(0, 0, PLAYER_Z);

    this._useGltf  = false;
    this._mixer    = null;
    this._runAction = null;

    if (assets?.playerGltf?.scene) {
      const root = SkeletonUtils.clone(assets.playerGltf.scene);
      this._setupFoxModel(root, assets.playerGltf);
      this._group.add(root);
      this._modelRoot = root;
      this._useGltf = true;
    } else {
      this._buildCyberSoldier();
    }

    // Player glow — cyan
    this._glow = new THREE.PointLight(0x00ffff, 2, 4);
    this._glow.position.set(0, 1, 0);
    this._group.add(this._glow);

    scene.add(this._group);

    this._runCycle   = 0;
    this._tiltTarget = 0;
    this._tiltCur    = 0;
    this._prevX      = 0;
  }

  // ── GLTF path (unchanged) ────────────────────────────────────────────────

  _setupFoxModel(root, gltf) {
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material && !Array.isArray(o.material)) {
          o.material = o.material.clone();
          o.material.emissive = new THREE.Color(0x003344);
          o.material.emissiveIntensity = 0.35;
        }
      }
    });

    const box  = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const s    = 1.35 / Math.max(size.y, 0.001);
    root.scale.setScalar(s);

    const box2 = new THREE.Box3().setFromObject(root);
    root.position.y = -box2.min.y;
    root.rotation.y = Math.PI * 0.5;

    this._mixer = new THREE.AnimationMixer(root);
    const clips = gltf.animations || [];
    let runClip = clips.find((c) => c.name === 'Run');
    if (!runClip && clips.length) runClip = clips[0];
    if (runClip) {
      this._runAction = this._mixer.clipAction(runClip);
      this._runAction.reset().fadeIn(0.2).play();
    }

    this._legL = null; this._legR = null;
    this._armL = null; this._armR = null;
    this._body = null; this._head = null;
    this._visor = null;
  }

  // ── Detailed Cyber-Soldier fallback ─────────────────────────────────────

  _buildCyberSoldier() {

    // ── Materials ──────────────────────────────────────────────────────────
    const armorMat = new THREE.MeshStandardMaterial({
      color:             0x0a1a2e,
      emissive:          new THREE.Color(0x003355),
      emissiveIntensity: 0.4,
      roughness:         0.35,
      metalness:         0.85,
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color:             0x00ddff,
      emissive:          new THREE.Color(0x00ffff),
      emissiveIntensity: 1.8,
      roughness:         0.1,
      metalness:         0.6,
    });

    const visorMat = new THREE.MeshStandardMaterial({
      color:             0xff00cc,
      emissive:          new THREE.Color(0xff00cc),
      emissiveIntensity: 2.2,
      roughness:         0.05,
      metalness:         0.9,
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color:     0x040a10,
      roughness: 0.6,
      metalness: 0.7,
    });

    // ── Torso ──────────────────────────────────────────────────────────────
    const torsoGeo = new THREE.BoxGeometry(0.72, 0.80, 0.40);
    this._body = new THREE.Mesh(torsoGeo, armorMat.clone());
    this._body.position.y = 1.00;
    this._body.castShadow = true;
    this._group.add(this._body);

    // Chest armor plate
    const chestGeo  = new THREE.BoxGeometry(0.50, 0.38, 0.08);
    const chestMesh = new THREE.Mesh(chestGeo, glowMat.clone());
    chestMesh.position.set(0, 1.05, 0.22);
    this._group.add(chestMesh);

    // Chest stripe — center emissive line
    const stripeGeo  = new THREE.BoxGeometry(0.06, 0.28, 0.10);
    const stripeMesh = new THREE.Mesh(stripeGeo, glowMat);
    stripeMesh.position.set(0, 1.05, 0.24);
    this._group.add(stripeMesh);

    // Shoulder pads
    for (const sx of [-0.44, 0.44]) {
      const padGeo  = new THREE.BoxGeometry(0.20, 0.20, 0.42);
      const padMesh = new THREE.Mesh(padGeo, armorMat.clone());
      padMesh.position.set(sx, 1.30, 0);
      padMesh.castShadow = true;
      this._group.add(padMesh);

      // Shoulder glow pip
      const pipGeo  = new THREE.BoxGeometry(0.07, 0.07, 0.44);
      const pipMesh = new THREE.Mesh(pipGeo, glowMat.clone());
      pipMesh.position.set(sx, 1.30, 0);
      this._group.add(pipMesh);
    }

    // ── Head ───────────────────────────────────────────────────────────────
    const headGeo = new THREE.BoxGeometry(0.50, 0.45, 0.44);
    this._head = new THREE.Mesh(headGeo, armorMat.clone());
    this._head.position.y = 1.645;
    this._head.castShadow = true;
    this._group.add(this._head);

    // Helmet top ridge
    const ridgeGeo  = new THREE.BoxGeometry(0.16, 0.10, 0.44);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, glowMat.clone());
    ridgeMesh.position.set(0, 1.90, 0);
    this._group.add(ridgeMesh);

    // Visor
    const visorGeo  = new THREE.BoxGeometry(0.40, 0.14, 0.08);
    this._visor = new THREE.Mesh(visorGeo, visorMat);
    this._visor.position.set(0, 1.64, 0.25);
    this._group.add(this._visor);

    // Chin under-guard
    const chinGeo  = new THREE.BoxGeometry(0.30, 0.08, 0.12);
    const chinMesh = new THREE.Mesh(chinGeo, darkMat);
    chinMesh.position.set(0, 1.46, 0.20);
    this._group.add(chinMesh);

    // ── Arms ───────────────────────────────────────────────────────────────
    //   Each arm is an upper-arm + forearm pivot so they swing during run.
    this._armL = new THREE.Group();
    this._armL.position.set(-0.46, 1.20, 0);
    this._group.add(this._armL);

    this._armR = new THREE.Group();
    this._armR.position.set(0.46, 1.20, 0);
    this._group.add(this._armR);

    for (const [armG, sx] of [[this._armL, -1], [this._armR, 1]]) {
      // Upper arm
      const upperGeo  = new THREE.BoxGeometry(0.20, 0.42, 0.22);
      const upperMesh = new THREE.Mesh(upperGeo, armorMat.clone());
      upperMesh.position.set(0, -0.21, 0);
      upperMesh.castShadow = true;
      armG.add(upperMesh);

      // Elbow pad
      const elbowGeo  = new THREE.BoxGeometry(0.22, 0.10, 0.24);
      const elbowMesh = new THREE.Mesh(elbowGeo, darkMat.clone());
      elbowMesh.position.set(0, -0.42, 0);
      armG.add(elbowMesh);

      // Forearm
      const foreGeo  = new THREE.BoxGeometry(0.17, 0.36, 0.20);
      const foreMesh = new THREE.Mesh(foreGeo, armorMat.clone());
      foreMesh.position.set(0, -0.65, 0);
      foreMesh.castShadow = true;
      armG.add(foreMesh);

      // Gauntlet glow tip
      const gauntGeo  = new THREE.BoxGeometry(0.20, 0.10, 0.22);
      const gauntMesh = new THREE.Mesh(gauntGeo, glowMat.clone());
      gauntMesh.position.set(0, -0.86, 0);
      armG.add(gauntMesh);
    }

    // ── Legs ───────────────────────────────────────────────────────────────
    this._legL = new THREE.Group();
    this._legL.position.set(-0.18, 0.58, 0);
    this._group.add(this._legL);

    this._legR = new THREE.Group();
    this._legR.position.set(0.18, 0.58, 0);
    this._group.add(this._legR);

    for (const legG of [this._legL, this._legR]) {
      // Thigh
      const thighGeo  = new THREE.BoxGeometry(0.26, 0.40, 0.26);
      const thighMesh = new THREE.Mesh(thighGeo, armorMat.clone());
      thighMesh.position.set(0, -0.20, 0);
      thighMesh.castShadow = true;
      legG.add(thighMesh);

      // Knee pad
      const kneeGeo  = new THREE.BoxGeometry(0.28, 0.10, 0.28);
      const kneeMesh = new THREE.Mesh(kneeGeo, glowMat.clone());
      kneeMesh.position.set(0, -0.40, 0);
      legG.add(kneeMesh);

      // Shin
      const shinGeo  = new THREE.BoxGeometry(0.22, 0.36, 0.24);
      const shinMesh = new THREE.Mesh(shinGeo, armorMat.clone());
      shinMesh.position.set(0, -0.62, 0);
      shinMesh.castShadow = true;
      legG.add(shinMesh);

      // Boot
      const bootGeo  = new THREE.BoxGeometry(0.26, 0.16, 0.32);
      const bootMesh = new THREE.Mesh(bootGeo, darkMat.clone());
      bootMesh.position.set(0, -0.84, 0.04);
      bootMesh.castShadow = true;
      legG.add(bootMesh);
    }

    // ── Jetpack ────────────────────────────────────────────────────────────
    const packGeo  = new THREE.BoxGeometry(0.38, 0.52, 0.18);
    const packMesh = new THREE.Mesh(packGeo, darkMat.clone());
    packMesh.position.set(0, 1.00, -0.28);
    this._group.add(packMesh);

    // Thruster cones
    for (const sx of [-0.10, 0.10]) {
      const thrG   = new THREE.ConeGeometry(0.06, 0.18, 6);
      const thrM   = new THREE.Mesh(thrG, glowMat.clone());
      thrM.rotation.x = Math.PI; // point downward
      thrM.position.set(sx, 0.74, -0.30);
      this._group.add(thrM);
      // Store so we can pulse them
      if (!this._thrusters) this._thrusters = [];
      this._thrusters.push(thrM);
    }

    this._modelRoot = null;
  }

  // ── Per-frame update ─────────────────────────────────────────────────────

  /**
   * @param {import('../game/Player.js').default} player
   * @param {number} dt — ms
   */
  update(player, dt) {
    const t = dt * 0.001;

    this._group.position.x = player.x;
    this._group.position.y = player.y;
    this._group.position.z = PLAYER_Z;

    // GLTF animation
    if (this._mixer) {
      this._mixer.update(t);
      if (this._runAction) {
        const runSpeed = player.isSliding ? 0.4 : player.isJumping ? 0.55 : 1.0;
        this._runAction.timeScale = runSpeed;
      }
    }

    // Bank / tilt on lane change
    const dx = player.x - this._prevX;
    this._tiltTarget = -dx * 2.5;
    this._prevX = player.x;
    this._tiltCur += (this._tiltTarget - this._tiltCur) * 0.18;
    this._group.rotation.z = THREE.MathUtils.clamp(this._tiltCur, -0.4, 0.4);

    if (!this._useGltf) {
      if (!player.isJumping && !player.isSliding) {
        this._runCycle += t * 8;

        // Legs swing opposing each other
        const legSwing = Math.sin(this._runCycle) * 0.38;
        if (this._legL) this._legL.rotation.x =  legSwing;
        if (this._legR) this._legR.rotation.x = -legSwing;

        // Arms swing opposing legs
        const armSwing = Math.sin(this._runCycle) * 0.45;
        if (this._armL) this._armL.rotation.x = -armSwing;
        if (this._armR) this._armR.rotation.x =  armSwing;
      } else {
        if (this._legL) this._legL.rotation.x = 0;
        if (this._legR) this._legR.rotation.x = 0;
        if (this._armL) this._armL.rotation.x = 0;
        if (this._armR) this._armR.rotation.x = 0;
      }

      // Thruster pulse
      if (this._thrusters) {
        const pulse = 0.8 + Math.sin(Date.now() * 0.008) * 0.5;
        for (const t_ of this._thrusters) {
          t_.material.emissiveIntensity = pulse;
        }
      }
    }

    // Slide squash
    if (player.isSliding) {
      this._group.scale.y += (0.45 - this._group.scale.y) * 0.2;
    } else {
      this._group.scale.y += (1.0  - this._group.scale.y) * 0.15;
    }

    // Jump lean forward
    if (player.isJumping) {
      this._group.rotation.x += (-0.18 - this._group.rotation.x) * 0.1;
    } else {
      this._group.rotation.x += (0 - this._group.rotation.x) * 0.1;
    }

    // Glow pulse
    this._glow.intensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.5;
  }
}
