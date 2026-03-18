import * as THREE from 'three';

const LANE_X = [-2, 0, 2];

export default class PowerUpMesh {

  constructor(scene) {
    this._scene  = scene;
    this._active = new Map(); // powerUp id → group

    // Shared material for magnet orb
    this._magnetMat = new THREE.MeshStandardMaterial({
      color:             0x00ff88,
      emissive:          new THREE.Color(0x00ff88),
      emissiveIntensity: 1.8,
      roughness:         0.1,
      metalness:         0.5,
      transparent:       true,
      opacity:           0.9,
    });

    // Outer shell material
    this._shellMat = new THREE.MeshStandardMaterial({
      color:             0x00ffaa,
      emissive:          new THREE.Color(0x00ffaa),
      emissiveIntensity: 0.8,
      roughness:         0.05,
      metalness:         0.8,
      transparent:       true,
      opacity:           0.3,
      side:              THREE.BackSide,
    });
  }

  _createMagnetGroup() {
    const group = new THREE.Group();

    // Inner glowing core
    const coreGeo  = new THREE.SphereGeometry(0.3, 16, 16);
    const core     = new THREE.Mesh(coreGeo, this._magnetMat);
    group.add(core);

    // Outer transparent shell (slightly larger)
    const shellGeo  = new THREE.SphereGeometry(0.48, 16, 16);
    const shell     = new THREE.Mesh(shellGeo, this._shellMat);
    group.add(shell);

    // Orbiting ring
    const ringGeo = new THREE.TorusGeometry(0.42, 0.04, 6, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const ring    = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // Point light for bloom halo
    const light = new THREE.PointLight(0x00ff88, 3, 5);
    group.add(light);

    group.userData.ring = ring;

    return group;
  }

  /**
   * @param {Array}  powerUps  - logic data: { id, laneIndex, z, type }
   * @param {number} time      - elapsed time in seconds
   */
  update(powerUps, time) {
    const activeIds = new Set(powerUps.map(p => p.id));

    // Remove stale meshes
    for (const [id, group] of this._active) {
      if (!activeIds.has(id)) {
        this._scene.remove(group);
        this._active.delete(id);
      }
    }

    // Create / update
    for (const pu of powerUps) {
      let group = this._active.get(pu.id);

      if (!group) {
        group = this._createMagnetGroup();
        this._scene.add(group);
        this._active.set(pu.id, group);
      }

      group.position.x = LANE_X[pu.laneIndex];
      group.position.y = 1.0 + Math.sin(time * 2) * 0.15; // float
      group.position.z = pu.z;

      // Spin entire group + ring tilt
      group.rotation.y = time * 1.5;
      group.userData.ring.rotation.x = time * 2.5;
      group.userData.ring.rotation.z = time * 1.8;
    }
  }

}
