import * as THREE from 'three';

/**
 * CityEnvironment — static backdrop buildings on both sides of the track.
 * Gives depth and a cyberpunk city feel without any performance cost.
 */
export default class CityEnvironment {

  constructor(scene) {
    this._scene = scene;
    this._buildCity();
  }

  _buildCity() {
    // Building specs: { x, z, w, h, d }
    // Left side buildings go at x < -4, right side at x > 4
    const rng = this._seeded(42);
    const nBuildings = 28;
    const sideOffsets = [-1, 1];

    // Synthwave palette for windows
    const windowColors = [
      0xff0066, // Hot Pink
      0x00ffff, // Cyan
      0x8a2be2, // Blue Violet
      0xff00ff, // Magenta
    ];

    // Dark synthwave body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x070014, // Very dark purple
      roughness: 0.8,
      metalness: 0.2,
    });

    for (let i = 0; i < nBuildings; i++) {
      const side   = i % 2 === 0 ? -1 : 1;
      const xBase  = side * (6.0 + rng() * 6.0);
      const zPos   = -15 - (i * 7) + rng() * 4;
      const width  = 1.0 + rng() * 2.2;
      const height = 3.5 + rng() * 9.5;
      const depth  = 1.0 + rng() * 2.0;

      // Main building body
      const geo  = new THREE.BoxGeometry(width, height, depth);
      const mesh = new THREE.Mesh(geo, bodyMat.clone());
      mesh.position.set(xBase, height / 2 - 0.01, zPos);
      mesh.castShadow = false;
      this._scene.add(mesh);

      // Roof top glow strip
      const roofMat  = new THREE.MeshBasicMaterial({ color: windowColors[Math.floor(rng() * windowColors.length)] });
      const roofGeo  = new THREE.BoxGeometry(width + 0.02, 0.06, depth + 0.02);
      const roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(xBase, height, zPos);
      this._scene.add(roofMesh);

      // Antenna on tall buildings
      if (height > 9) {
        const antGeo  = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4);
        const antMesh = new THREE.Mesh(antGeo, bodyMat.clone());
        antMesh.position.set(xBase + (rng() - 0.5) * 0.4, height + 0.7, zPos);
        this._scene.add(antMesh);

        // Blinking antenna tip
        const tipGeo  = new THREE.SphereGeometry(0.06, 4, 4);
        const tipMat  = new THREE.MeshBasicMaterial({ color: 0xff2200 });
        const tipMesh = new THREE.Mesh(tipGeo, tipMat);
        tipMesh.position.set(xBase + (rng() - 0.5) * 0.4, height + 1.4, zPos);
        this._scene.add(tipMesh);
        if (!this._antennaTips) this._antennaTips = [];
        this._antennaTips.push(tipMesh);
      }

      // Window rows — scattered emissive quads
      const windowCols = Math.floor(width / 0.55);
      const windowRows = Math.floor(height / 0.85);
      const windowGeo  = new THREE.PlaneGeometry(0.22, 0.28);

      for (let wr = 0; wr < windowRows; wr++) {
        for (let wc = 0; wc < windowCols; wc++) {
          if (rng() < 0.40) continue; // 40% dark windows
          const wMat  = new THREE.MeshBasicMaterial({ color: windowColors[Math.floor(rng() * windowColors.length)] });
          wMat.opacity    = 0.55 + rng() * 0.45;
          wMat.transparent = true;
          const wMesh = new THREE.Mesh(windowGeo, wMat);
          const wx = xBase - width / 2 + 0.35 + wc * (width / windowCols);
          const wy = 0.5 + wr * (height / windowRows);
          const wz = zPos + depth / 2 * side * -1 + 0.01 * side;
          wMesh.position.set(wx, wy, wz);
          if (side < 0) wMesh.rotation.y = 0;
          else          wMesh.rotation.y = Math.PI;
          this._scene.add(wMesh);
        }
      }
    }

    // Ground extension — dark pavement beyond the track edges
    const paveMat = new THREE.MeshStandardMaterial({
      color:     0x04050c,
      roughness: 0.9,
      metalness: 0.1,
    });
    for (const sx of sideOffsets) {
      const paveGeo  = new THREE.PlaneGeometry(10, 200);
      const paveMesh = new THREE.Mesh(paveGeo, paveMat.clone());
      paveMesh.rotation.x = -Math.PI / 2;
      paveMesh.position.set(sx * 9, -0.005, -80);
      this._scene.add(paveMesh);
    }
  }

  /** Tiny deterministic seeded random (Mulberry32) — avoids Math.random() seeding issues. */
  _seeded(seed) {
    let s = seed | 0;
    return () => {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Optional: call from game loop if you want antenna tip blinking */
  update() {
    if (!this._antennaTips) return;
    const on = (Math.floor(Date.now() / 800) % 2) === 0;
    for (const tip of this._antennaTips) {
      tip.visible = on;
    }
  }
}
