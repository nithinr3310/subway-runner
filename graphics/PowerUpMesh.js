import * as THREE from 'three';

const LANE_X = [-2, 0, 2];

export default class PowerUpMesh {

  constructor(scene) {
    this._scene  = scene;
    this._active = new Map(); // powerUp id → group

    // ── Magnet material
    this._magnetMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88, emissive: new THREE.Color(0x00ff88),
      emissiveIntensity: 1.8, roughness: 0.1, metalness: 0.5,
      transparent: true, opacity: 0.9,
    });
    this._magnetShellMat = new THREE.MeshStandardMaterial({
      color: 0x00ffaa, emissive: new THREE.Color(0x00ffaa),
      emissiveIntensity: 0.8, roughness: 0.05, metalness: 0.8,
      transparent: true, opacity: 0.3, side: THREE.BackSide,
    });

    // ── Shield material — blue crystal
    this._shieldMat = new THREE.MeshStandardMaterial({
      color: 0x0066ff, emissive: new THREE.Color(0x0088ff),
      emissiveIntensity: 2.0, roughness: 0.05, metalness: 0.6,
      transparent: true, opacity: 0.85,
    });
    this._shieldShellMat = new THREE.MeshStandardMaterial({
      color: 0x2255ff, emissive: new THREE.Color(0x4488ff),
      emissiveIntensity: 0.9, roughness: 0.0, metalness: 0.9,
      transparent: true, opacity: 0.25, side: THREE.BackSide,
    });

    // ── Dash material — electric gold
    this._dashMat = new THREE.MeshStandardMaterial({
      color: 0xffdd00, emissive: new THREE.Color(0xffaa00),
      emissiveIntensity: 2.5, roughness: 0.1, metalness: 0.5,
      transparent: true, opacity: 0.95,
    });
    this._dashShellMat = new THREE.MeshStandardMaterial({
      color: 0xffff44, emissive: new THREE.Color(0xffdd44),
      emissiveIntensity: 1.0, roughness: 0.0, metalness: 0.7,
      transparent: true, opacity: 0.2, side: THREE.BackSide,
    });
  }

  // ── Group builders ──────────────────────────────────────────────────────

  _createMagnetGroup() {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.30, 16, 16), this._magnetMat));
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), this._magnetShellMat));

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.04, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    group.add(ring);
    group.userData.ring = ring;

    const light = new THREE.PointLight(0x00ff88, 3, 5);
    group.add(light);
    group.userData.label = 'magnet';
    return group;
  }

  _createShieldGroup() {
    const group = new THREE.Group();

    // Inner crystal orb
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), this._shieldMat.clone());
    group.add(core);
    group.userData.core = core;

    // Outer shell
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.50, 16, 12), this._shieldShellMat));

    // Hex ring overlay
    const hexRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.44, 0.05, 6, 6), // 6-segment = hexagon ring
      new THREE.MeshBasicMaterial({ color: 0x44aaff })
    );
    hexRing.rotation.x = Math.PI / 2;
    group.add(hexRing);
    group.userData.ring = hexRing;

    // Second tilted ring
    const hexRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.44, 0.03, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x0066ff })
    );
    group.add(hexRing2);
    group.userData.ring2 = hexRing2;

    const light = new THREE.PointLight(0x0088ff, 3.5, 5);
    group.add(light);
    group.userData.label = 'shield';
    return group;
  }

  _createDashGroup() {
    const group = new THREE.Group();

    // Lightning bolt inner core (octahedron for jagged feel)
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), this._dashMat.clone());
    group.add(core);
    group.userData.core = core;

    // Outer shell
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.50, 12, 10), this._dashShellMat));

    // Speed rings
    for (let i = 0; i < 3; i++) {
      const r    = 0.30 + i * 0.08;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.03, 4, 12),
        new THREE.MeshBasicMaterial({ color: 0xffcc00 })
      );
      ring.rotation.x = (Math.PI / 2) + i * 0.4;
      ring.rotation.z = i * 0.5;
      group.add(ring);
      if (!group.userData.speedRings) group.userData.speedRings = [];
      group.userData.speedRings.push(ring);
    }

    const light = new THREE.PointLight(0xffaa00, 4.0, 5);
    group.add(light);
    group.userData.label = 'dash';
    return group;
  }

  // ── Per-frame update ─────────────────────────────────────────────────────

  /**
   * @param {Array}  powerUps  - logic data: { id, laneIndex, z, type }
   * @param {number} time      - elapsed time in seconds
   */
  update(powerUps, time) {
    const activeIds = new Set(powerUps.map(p => p.id));

    // Remove stale
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
        if (pu.type === 'magnet') group = this._createMagnetGroup();
        else if (pu.type === 'shield') group = this._createShieldGroup();
        else group = this._createDashGroup();
        this._scene.add(group);
        this._active.set(pu.id, group);
      }

      group.position.x = LANE_X[pu.laneIndex];
      group.position.y = 1.0 + Math.sin(time * 2) * 0.15;
      group.position.z = pu.z;
      group.rotation.y = time * 1.5;

      // Type-specific animations
      if (pu.type === 'magnet' && group.userData.ring) {
        group.userData.ring.rotation.x = time * 2.5;
        group.userData.ring.rotation.z = time * 1.8;
      }
      if (pu.type === 'shield') {
        if (group.userData.ring)  group.userData.ring.rotation.z  = time * 1.4;
        if (group.userData.ring2) group.userData.ring2.rotation.x = time * 2.1;
        if (group.userData.core)  group.userData.core.rotation.y  = time * 0.8;
      }
      if (pu.type === 'dash') {
        if (group.userData.core) group.userData.core.rotation.x = time * 3;
        if (group.userData.speedRings) {
          group.userData.speedRings.forEach((r, i) => {
            r.rotation.z = time * (2 + i * 0.5);
          });
        }
      }
    }
  }

}
