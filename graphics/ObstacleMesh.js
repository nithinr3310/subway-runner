import * as THREE from 'three';
import { LANE_X } from '../game/WorldConfig.js';

const POOL_SIZE = 12;

/**
 * Three obstacle visual variants that cycle through the pool:
 *  0 - Cyber Barrier (classic red block, polished)
 *  1 - Neon Pillar    (tall cylinder with glowing ring)
 *  2 - Hover Mine     (spinning hex disc at mid-height)
 */
export default class ObstacleMesh {

  constructor(scene) {
    this._scene  = scene;
    this._pool   = [];
    this._active = new Map(); // obstacle id → mesh group

    this._variantIndex = 0; // round-robins through 0/1/2

    // Pre-build pool — alternating variants
    for (let i = 0; i < POOL_SIZE; i++) {
      const variant = i % 3;
      const mesh    = this._makeMesh(variant);
      mesh.visible  = false;
      scene.add(mesh);
      this._pool.push(mesh);
    }
  }

  // ── Variant factories ────────────────────────────────────────────────────

  _makeMesh(variant) {
    const group = new THREE.Group();
    group.userData.variant = variant;

    if (variant === 0) this._makeBarrier(group);
    else if (variant === 1) this._makePillar(group);
    else this._makeHoverMine(group);

    return group;
  }

  /** Variant 0: Classic red cyber barrier block */
  _makeBarrier(group) {
    const mat = new THREE.MeshStandardMaterial({
      color:             0xff0044,
      emissive:          new THREE.Color(0xff0066),
      emissiveIntensity: 1.4,
      roughness:         0.3,
      metalness:         0.7,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.5), mat);
    body.position.y = 0.7;
    body.castShadow = true;
    group.add(body);

    // Top neon strip
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.08, 0.54),
      new THREE.MeshBasicMaterial({ color: 0xff66aa })
    );
    trim.position.y = 1.44;
    group.add(trim);

    // Warning stripes
    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.2, 0.02),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xffcc00 : 0xff0044 })
      );
      stripe.position.set(-0.42 + i * 0.42, 0.6, 0.27);
      group.add(stripe);
    }

    // Side edge glow lines
    for (const sx of [-0.56, 0.56]) {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 1.5, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xff0066 })
      );
      edge.position.set(sx, 0.75, 0);
      group.add(edge);
    }
  }

  /** Variant 1: Neon Pillar — tall cylinder with rotating glow ring */
  _makePillar(group) {
    const pillarMat = new THREE.MeshStandardMaterial({
      color:             0x110022,
      emissive:          new THREE.Color(0x6600ff),
      emissiveIntensity: 0.8,
      roughness:         0.25,
      metalness:         0.85,
    });

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.30, 0.34, 2.0, 10),
      pillarMat
    );
    pillar.position.y = 1.0;
    pillar.castShadow = true;
    group.add(pillar);

    // Glowing energy rings
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xaa44ff });
    for (const ry of [0.50, 1.00, 1.50]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.045, 6, 20),
        ringMat.clone()
      );
      ring.position.y     = ry;
      ring.rotation.x     = Math.PI / 2;
      ring.userData.isRing = true;
      group.add(ring);
    }

    // Top orb
    const orbMat = new THREE.MeshStandardMaterial({
      color:             0x9900ff,
      emissive:          new THREE.Color(0xcc00ff),
      emissiveIntensity: 3.0,
      roughness:         0.0,
      metalness:         0.5,
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), orbMat);
    orb.position.y = 2.12;
    group.add(orb);

    // Orb glow
    const light = new THREE.PointLight(0xaa00ff, 3, 4);
    light.position.y = 2.12;
    group.add(light);
  }

  /** Variant 2: Hover Mine — spinning hexagonal disc at mid-height */
  _makeHoverMine(group) {
    const mineMat = new THREE.MeshStandardMaterial({
      color:             0x220011,
      emissive:          new THREE.Color(0xff3300),
      emissiveIntensity: 1.2,
      roughness:         0.2,
      metalness:         0.9,
    });

    // Hex body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.50, 0.50, 0.22, 6),
      mineMat
    );
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);
    group.userData.spinner = body;

    // Outer ring
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.05, 5, 12),
      ringMat
    );
    outerRing.position.y = 0.85;
    outerRing.rotation.x = Math.PI / 2;
    group.add(outerRing);
    group.userData.outerRing = outerRing;

    // Spike details
    for (let i = 0; i < 6; i++) {
      const ang  = (i / 6) * Math.PI * 2;
      const spikeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.28, 4),
        spikeMat
      );
      spike.position.set(
        Math.cos(ang) * 0.52,
        0.85,
        Math.sin(ang) * 0.52
      );
      spike.rotation.z = -Math.PI / 2;
      spike.rotation.y = -ang;
      group.add(spike);
    }

    // Central danger symbol (just a bright sphere)
    const coreMat = new THREE.MeshStandardMaterial({
      color:             0xff0000,
      emissive:          new THREE.Color(0xff0000),
      emissiveIntensity: 4.0,
      roughness:         0.0,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), coreMat);
    core.position.y = 0.85;
    group.add(core);

    // Point light
    const light = new THREE.PointLight(0xff3300, 2.5, 3.5);
    light.position.y = 0.85;
    group.add(light);
  }

  // ── Pool helpers ─────────────────────────────────────────────────────────

  _getFromPool(variant) {
    // Prefer matching variant, fall back to any free
    const preferred = this._pool.find(m => !m.visible && m.userData.variant === variant);
    return preferred || this._pool.find(m => !m.visible) || null;
  }

  // ── Per-frame update ─────────────────────────────────────────────────────

  /**
   * @param {Array<{id, laneIndex, z, width, height, isSlide}>} obstacles
   */
  update(obstacles) {
    const activeIds = new Set(obstacles.map(o => o.id));

    // Release stale
    for (const [id, mesh] of this._active) {
      if (!activeIds.has(id)) {
        mesh.visible = false;
        this._active.delete(id);
      }
    }

    const now = Date.now();

    // Position active
    for (const obs of obstacles) {
      let mesh = this._active.get(obs.id);

      if (!mesh) {
        // Pick a fixed variant per obstacle based on its id mod 3
        const variant = obs.id % 3;
        mesh = this._getFromPool(variant);
        if (!mesh) continue;
        this._active.set(obs.id, mesh);
      }

      mesh.visible    = true;
      mesh.position.x = LANE_X[obs.laneIndex];
      mesh.position.y = 0;
      mesh.position.z = obs.z;

      // Slide: squash
      mesh.scale.y = obs.isSlide ? 0.4 : 1.0;

      // Animate spinning parts
      const variant = mesh.userData.variant;
      if (variant === 1) {
        // Pillar: spin rings
        mesh.traverse((child) => {
          if (child.userData.isRing) {
            child.rotation.z = now * 0.002;
          }
        });
      } else if (variant === 2) {
        // Hover mine: spin body + outer ring
        if (mesh.userData.spinner)   mesh.userData.spinner.rotation.y   = now * 0.003;
        if (mesh.userData.outerRing) mesh.userData.outerRing.rotation.z = now * 0.0025;
        // Hover bob
        mesh.position.y = Math.sin(now * 0.004 + obs.id) * 0.12;
      }
    }
  }

}
