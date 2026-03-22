import { LANE_X, PLAYER_Z, SCROLL_FACTOR } from './WorldConfig.js';

/**
 * Pursuit entity: moves in world Z with extra catch-up vs scroll so it closes on the player.
 * State is read by EnemyMesh and Collision.
 *
 * BUG FIX: reduced lateral lerp (0.055 vs old 0.11) so the enemy can't
 * instantly teleport into a lane the player just switched to.
 * Grace period after reset prevents frame-zero collision.
 */
export default class ChaserEnemy {

  constructor(game) {
    this.game = game;

    /** World-space width for AABB (matches visual body). */
    this.width = 1.1;
    /** Vertical extent of damage volume. */
    this.hitHeight = 2.6;

    /**
     * Grace ticks: collision is suppressed for this many frames after a reset.
     * This prevents an edge-case where the chaser re-enters the collision window
     * on the very frame it resets.
     */
    this._graceTick = 0;

    this.reset();
  }

  get isGrace() {
    return this._graceTick > 0;
  }

  reset() {
    // Always reset to center lane — never snap to player X
    this.x = LANE_X[1];
    this.z = -28;
    // 40-frame grace window after every reset
    this._graceTick = 40;
  }

  update() {
    if (!this.game.running) return;

    // Count down grace period
    if (this._graceTick > 0) this._graceTick--;

    const speed = this.game.speed * SCROLL_FACTOR;
    const score = this.game.score;

    // Extra Z beyond world scroll — ramps slowly so the run stays playable
    const catchUp = 0.007 + Math.min(0.045, score * 0.000028);

    this.z += speed + catchUp;

    // The drone no longer tracks the player laterally.
    // It is permanently locked to the center lane.
    this.x = LANE_X[1];

    // If the chaser overshoots, reset to center so it can't sneak past the player
    if (this.z > PLAYER_Z + 4) {
      this.z = -26 - Math.min(18, this.game.score * 0.02);
      this.x = LANE_X[1]; // center lane, not player position
      this._graceTick = 40;
    }
  }
}
