/**
 * CoinManager — pure game logic in 3D world units.
 *
 * Each coin:
 *   { id, laneIndex (0/1/2), z (world Z) }
 */
import { DESPAWN_Z, LANE_X, PICKUP_SPAWN_Z, SCROLL_FACTOR } from './WorldConfig.js';

let _nextId = 1000;

export default class CoinManager {

  constructor(game) {
    this.game        = game;
    this.coins       = [];
    this.spawnTimer  = 0;
    this.trailLength = 6;
    this.trailGap    = 1.8; // world units between coins in a trail
  }

  spawnCoinTrail() {
    const lane = Math.floor(Math.random() * 3);

    for (let i = 0; i < this.trailLength; i++) {
      this.coins.push({
        id:        _nextId++,
        laneIndex: lane,
        z:         PICKUP_SPAWN_Z - i * this.trailGap,
      });
    }
  }

  update() {
    this.spawnTimer++;

    if (this.spawnTimer > 140) {
      this.spawnCoinTrail();
      this.spawnTimer = 0;
    }

    const speed = this.game.speed * SCROLL_FACTOR;

    for (const coin of this.coins) {
      coin.z += speed;

      // Magnet effect: pull coin toward player's lane and Z
      if (this.game.magnetActive) {
        const playerLaneX = this.game.player.lanes[this.game.player.currentLane];
        const coinLaneX   = LANE_X[coin.laneIndex];
        const dx = playerLaneX - coinLaneX;
        const dz = this.game.player.z - coin.z; // player is at ~z=2

        coin.z += dz * 0.04;

        // Shift laneIndex if pulled far enough
        if (Math.abs(dx) > 0.5) {
          const targetLane = this.game.player.currentLane;
          if (coin.laneIndex !== targetLane) {
            coin.laneIndex += dx > 0 ? 1 : -1;
            coin.laneIndex  = Math.max(0, Math.min(2, coin.laneIndex));
          }
        }
      }
    }

    // Remove coins past the camera
    this.coins = this.coins.filter(c => c.z < DESPAWN_Z);
  }

  /**
   * Called by Game.js when a coin is collected — removes it by id.
   */
  removeCoin(id) {
    this.coins = this.coins.filter(c => c.id !== id);
  }

}