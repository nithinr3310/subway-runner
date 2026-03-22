/**
 * PowerUpManager — pure game logic in 3D world units.
 *
 * Power-up types: 'magnet' | 'shield' | 'dash'
 */
import { DESPAWN_Z, PICKUP_SPAWN_Z, SCROLL_FACTOR } from './WorldConfig.js';

let _nextId = 5000;

// Spawn weights: (magnet: 35%, shield: 35%, dash: 30%)
const TYPES = ['magnet', 'magnet', 'shield', 'shield', 'dash', 'dash'];

export default class PowerUpManager {

  constructor(game) {
    this.game       = game;
    this.powerUps   = [];
    this.spawnTimer = 0;
  }

  _spawn(type) {
    const lane = Math.floor(Math.random() * 3);
    this.powerUps.push({
      id:        _nextId++,
      laneIndex: lane,
      z:         PICKUP_SPAWN_Z,
      type,
      size:      0.45,
    });
  }

  update() {
    this.spawnTimer++;

    // Spawn one every ~480 frames (≈ 8 seconds at 60fps)
    if (this.spawnTimer > 480) {
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      this._spawn(type);
      this.spawnTimer = 0;
    }

    const speed = this.game.speed * SCROLL_FACTOR;

    for (const pu of this.powerUps) {
      pu.z += speed;
    }

    this.powerUps = this.powerUps.filter(pu => pu.z < DESPAWN_Z);
  }

  removePowerUp(id) {
    this.powerUps = this.powerUps.filter(pu => pu.id !== id);
  }

}