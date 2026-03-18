/**
 * PowerUpManager — pure game logic in 3D world units.
 *
 * Each power-up:
 *   { id, laneIndex (0/1/2), z (world Z), type }
 *
 * Current types: 'magnet'
 */
let _nextId = 5000;

export default class PowerUpManager {

  constructor(game) {
    this.game       = game;
    this.powerUps   = [];
    this.spawnTimer = 0;
  }

  spawnMagnet() {
    const lane = Math.floor(Math.random() * 3);
    this.powerUps.push({
      id:        _nextId++,
      laneIndex: lane,
      z:         -52,
      type:      'magnet',
      size:      0.45,
    });
  }

  update() {
    this.spawnTimer++;

    if (this.spawnTimer > 550) {
      this.spawnMagnet();
      this.spawnTimer = 0;
    }

    const speed = this.game.speed * 0.1;

    for (const pu of this.powerUps) {
      pu.z += speed;
    }

    this.powerUps = this.powerUps.filter(pu => pu.z < 6);
  }

  /**
   * Called by Game.js when a power-up is collected.
   */
  removePowerUp(id) {
    this.powerUps = this.powerUps.filter(pu => pu.id !== id);
  }

}