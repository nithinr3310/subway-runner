import * as THREE from 'three';

const POOL_SIZE = 12;

// Map lane index 0/1/2 → world X
const LANE_X = [-2, 0, 2];

// How far in front of the camera obstacles start
const SPAWN_Z = -50;

export default class ObstacleMesh {

  constructor(scene) {
    this._scene   = scene;
    this._pool    = [];
    this._active  = new Map(); // obstacle id → mesh

    // Material shared by all obstacle instances
    this._mat = new THREE.MeshStandardMaterial({
      color:            0xff0044,
      emissive:         new THREE.Color(0xff0066),
      emissiveIntensity: 1.4,
      roughness:        0.3,
      metalness:        0.7,
    });

    // Pre-build pool
    for (let i = 0; i < POOL_SIZE; i++) {
      const mesh = this._makeMesh();
      mesh.visible = false;
      scene.add(mesh);
      this._pool.push(mesh);
    }
  }

  _makeMesh() {
    const group = new THREE.Group();

    // Main barrier block
    const geo = new THREE.BoxGeometry(1.1, 1.4, 0.5);
    const block = new THREE.Mesh(geo, this._mat);
    block.position.y = 0.7;
    group.add(block);

    // Top neon trim strip
    const trimGeo = new THREE.BoxGeometry(1.1, 0.08, 0.52);
    const trimMat = new THREE.MeshBasicMaterial({ color: 0xff66aa });
    const trim    = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = 1.44;
    group.add(trim);

    // Warning stripes on front face
    const stripeCount = 3;
    for (let i = 0; i < stripeCount; i++) {
      const sGeo = new THREE.BoxGeometry(0.12, 1.2, 0.02);
      const sMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffcc00 : 0xff0044,
      });
      const stripe = new THREE.Mesh(sGeo, sMat);
      stripe.position.set(-0.42 + i * 0.42, 0.6, 0.27);
      group.add(stripe);
    }

    return group;
  }

  _getFromPool() {
    const free = this._pool.find(m => !m.visible);
    return free || null;
  }

  /**
   * Sync mesh pool to the current obstacle logicdata array.
   * obstacles: Array<{ id, laneIndex, z, width, height, isSlide }>
   */
  update(obstacles) {
    const activeIds = new Set(obstacles.map(o => o.id));

    // Release idle meshes no longer in the active list
    for (const [id, mesh] of this._active) {
      if (!activeIds.has(id)) {
        mesh.visible = false;
        this._active.delete(id);
      }
    }

    // Position active meshes
    for (const obs of obstacles) {
      let mesh = this._active.get(obs.id);

      if (!mesh) {
        mesh = this._getFromPool();
        if (!mesh) continue; // pool exhausted (shouldn't happen)
        this._active.set(obs.id, mesh);
      }

      mesh.visible = true;
      mesh.position.x = LANE_X[obs.laneIndex];
      mesh.position.y = 0;
      mesh.position.z = obs.z;

      // Slide obstacle: flatten
      mesh.scale.y = obs.isSlide ? 0.4 : 1.0;
    }
  }

}
