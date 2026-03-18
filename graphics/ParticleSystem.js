import * as THREE from 'three';

const MAX_PARTICLES = 200;

/**
 * Lightweight GPU-side particle system using THREE.Points.
 * Two emitter types: coin-collect sparks and death explosion.
 */
export default class ParticleSystem {

  constructor(scene) {
    this._particles = []; // array of live particle objects

    // One shared Points object for all particles
    this._positions = new Float32Array(MAX_PARTICLES * 3);
    this._colors    = new Float32Array(MAX_PARTICLES * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(this._colors,    3));

    const mat = new THREE.PointsMaterial({
      size:            0.18,
      vertexColors:    true,
      transparent:     true,
      opacity:         1.0,
      depthWrite:      false,
      blending:        THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this._points = new THREE.Points(geo, mat);
    scene.add(this._points);
  }

  // ── Emitters ─────────────────────────────────────────────────────────────

  /** Small gold sparks when a coin is collected */
  emitCoinCollect(x, y, z) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      this._particles.push({
        x, y: y + 0.8, z,
        vx: (Math.random() - 0.5) * 0.12,
        vy: Math.random() * 0.15 + 0.05,
        vz: (Math.random() - 0.5) * 0.12,
        life: 1.0,
        decay: 0.04 + Math.random() * 0.03,
        r: 1.0, g: 0.8, b: 0.1,
      });
    }
  }

  /** Large cyan/white explosion when player dies */
  emitDeath(x, y, z) {
    const count = 60;
    for (let i = 0; i < count; i++) {
      const isCyan = Math.random() < 0.6;
      this._particles.push({
        x, y: y + 0.8, z,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        vz: (Math.random() - 0.5) * 0.28,
        life: 1.0,
        decay: 0.018 + Math.random() * 0.02,
        r: isCyan ? 0.0 : 1.0,
        g: isCyan ? 1.0 : 1.0,
        b: isCyan ? 1.0 : 1.0,
      });
    }
  }

  /** Small magenta sparks showing magnet field */
  emitMagnetPull(x, y, z) {
    if (Math.random() > 0.15) return; // sparse
    this._particles.push({
      x: x + (Math.random() - 0.5) * 3,
      y: y + Math.random() * 1.5,
      z: z + (Math.random() - 0.5) * 1,
      vx: 0, vy: 0, vz: 0,
      life: 1.0,
      decay: 0.08,
      r: 1.0, g: 0.0, b: 0.9,
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update() {
    // Advance physics
    for (const p of this._particles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.z  += p.vz;
      p.vy -= 0.004; // gravity
      p.life -= p.decay;
    }

    // Kill dead particles
    this._particles = this._particles.filter(p => p.life > 0);

    // Clamp to MAX_PARTICLES
    if (this._particles.length > MAX_PARTICLES) {
      this._particles.splice(0, this._particles.length - MAX_PARTICLES);
    }

    // Upload to GPU
    const pos  = this._positions;
    const col  = this._colors;
    const len  = this._particles.length;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < len) {
        const p = this._particles[i];
        pos[i * 3]     = p.x;
        pos[i * 3 + 1] = p.y;
        pos[i * 3 + 2] = p.z;
        col[i * 3]     = p.r * p.life;
        col[i * 3 + 1] = p.g * p.life;
        col[i * 3 + 2] = p.b * p.life;
      } else {
        // Park dead slot far off-screen
        pos[i * 3]     = 0;
        pos[i * 3 + 1] = -1000;
        pos[i * 3 + 2] = 0;
      }
    }

    const geo = this._points.geometry;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate    = true;
  }

}
