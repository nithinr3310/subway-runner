import * as THREE from 'three';

export default class PlayerMesh {

  constructor(scene) {

    this._group = new THREE.Group();

    // ── Body ──────────────────────────────────────────────
    const bodyGeo = new THREE.BoxGeometry(0.7, 1.4, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00cccc,
      emissive: new THREE.Color(0x00ffff),
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.6,
    });
    this._body = new THREE.Mesh(bodyGeo, bodyMat);
    this._body.position.y = 0.7;
    this._group.add(this._body);

    // ── Helmet/Head ───────────────────────────────────────
    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.5);
    const headMat = bodyMat.clone();
    headMat.emissiveIntensity = 0.5;
    this._head = new THREE.Mesh(headGeo, headMat);
    this._head.position.y = 1.675;
    this._group.add(this._head);

    // ── Visor ─────────────────────────────────────────────
    const visorGeo = new THREE.BoxGeometry(0.45, 0.18, 0.1);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xff00cc,
      emissive: new THREE.Color(0xff00cc),
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.8,
    });
    this._visor = new THREE.Mesh(visorGeo, visorMat);
    this._visor.position.set(0, 1.72, 0.31);
    this._group.add(this._visor);

    // ── Legs ──────────────────────────────────────────────
    const legGeo = new THREE.BoxGeometry(0.25, 0.55, 0.3);
    const legMat = bodyMat.clone();
    legMat.emissiveIntensity = 0.4;

    this._legL = new THREE.Mesh(legGeo, legMat);
    this._legL.position.set(-0.185, 0.275, 0);
    this._group.add(this._legL);

    this._legR = new THREE.Mesh(legGeo, legMat.clone());
    this._legR.position.set(0.185, 0.275, 0);
    this._group.add(this._legR);

    // ── Player-emitted point light ─────────────────────────
    this._glow = new THREE.PointLight(0x00ffff, 2, 4);
    this._glow.position.set(0, 1, 0);
    this._group.add(this._glow);

    scene.add(this._group);

    // ── Internal animation state ──────────────────────────
    this._runCycle   = 0;
    this._tiltTarget = 0;
    this._tiltCur    = 0;
    this._prevX      = 0;
  }

  /**
   * Sync 3D mesh to Player logic state every frame.
   * @param {Player} player  - the game/Player instance
   * @param {number} dt      - deltaTime in ms
   */
  update(player, dt) {
    const t = dt * 0.001; // seconds

    // ── Position ──────────────────────────────────────────
    const worldX = player.x;
    const worldY = player.y; // already in 3D world units
    this._group.position.x = worldX;
    this._group.position.y = worldY;
    this._group.position.z = 2; // player stays near camera

    // ── Tilt on lane change ───────────────────────────────
    const dx = worldX - this._prevX;
    this._tiltTarget = -dx * 2.5;
    this._prevX = worldX;

    this._tiltCur += (this._tiltTarget - this._tiltCur) * 0.18;
    this._group.rotation.z = THREE.MathUtils.clamp(this._tiltCur, -0.4, 0.4);

    // ── Run animation (leg bob) ───────────────────────────
    if (!player.isJumping && !player.isSliding) {
      this._runCycle += t * 8;
      const legSwing = Math.sin(this._runCycle) * 0.25;
      this._legL.rotation.x =  legSwing;
      this._legR.rotation.x = -legSwing;
    } else {
      this._legL.rotation.x = 0;
      this._legR.rotation.x = 0;
    }

    // ── Slide: squish height ───────────────────────────────
    if (player.isSliding) {
      this._group.scale.y += (0.45 - this._group.scale.y) * 0.2;
    } else {
      this._group.scale.y += (1.0  - this._group.scale.y) * 0.15;
    }

    // ── Jump: subtle forward tilt ─────────────────────────
    if (player.isJumping) {
      this._group.rotation.x += (-0.18 - this._group.rotation.x) * 0.1;
    } else {
      this._group.rotation.x += (0 - this._group.rotation.x) * 0.1;
    }

    // ── Glow pulse ────────────────────────────────────────
    this._glow.intensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.5;
  }

}