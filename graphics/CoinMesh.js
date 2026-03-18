import * as THREE from 'three';

const POOL_SIZE = 30;
const LANE_X    = [-2, 0, 2];

export default class CoinMesh {

  constructor(scene) {
    this._scene  = scene;
    this._pool   = [];
    this._active = new Map(); // coin id → mesh

    const mat = new THREE.MeshStandardMaterial({
      color:             0xffcc00,
      emissive:          new THREE.Color(0xffaa00),
      emissiveIntensity: 1.5,
      roughness:         0.2,
      metalness:         0.9,
    });

    // Flat disc geometry (oriented vertically like a coin)
    const geo = new THREE.CylinderGeometry(0.28, 0.28, 0.07, 16);

    for (let i = 0; i < POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(geo, mat);

      // Coin ring rim
      const rimGeo = new THREE.TorusGeometry(0.28, 0.04, 6, 16);
      const rimMat = new THREE.MeshBasicMaterial({ color: 0xffee44 });
      const rim    = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;

      const group = new THREE.Group();
      group.add(mesh);
      group.add(rim);
      group.visible = false;

      // Store initial random rotation offset so coins don't all spin in sync
      group.userData.rotOffset = Math.random() * Math.PI * 2;

      scene.add(group);
      this._pool.push(group);
    }
  }

  _getFree() {
    return this._pool.find(m => !m.visible) || null;
  }

  /**
   * @param {Array} coins  - coin logic data: { id, laneIndex, z }
   * @param {number} time  - elapsed time in seconds for spin animation
   */
  update(coins, time) {
    const activeIds = new Set(coins.map(c => c.id));

    // Recycle
    for (const [id, mesh] of this._active) {
      if (!activeIds.has(id)) {
        mesh.visible = false;
        this._active.delete(id);
      }
    }

    // Place
    for (const coin of coins) {
      let mesh = this._active.get(coin.id);

      if (!mesh) {
        mesh = this._getFree();
        if (!mesh) continue;
        this._active.set(coin.id, mesh);
      }

      mesh.visible    = true;
      mesh.position.x = LANE_X[coin.laneIndex];
      mesh.position.y = 0.8;
      mesh.position.z = coin.z;

      // Spin + float bob
      mesh.rotation.y = time * 3 + mesh.userData.rotOffset;
      mesh.position.y = 0.8 + Math.sin(time * 2 + mesh.userData.rotOffset) * 0.08;
    }
  }

}
