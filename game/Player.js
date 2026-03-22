import { LANE_X, PLAYER_Z } from './WorldConfig.js';

/**
 * Player — pure game logic, no drawing.
 *
 * Coordinate space:
 *   X   = world X: lanes at -2, 0, +2
 *   y   = 3D Y: ground=0, jump peak ≈ 3.0
 *
 * PlayerMesh.js reads .x, .y, .isSliding, .isJumping each frame.
 */

export default class Player {

  constructor(game) {
    this.game = game;

    // Collision box dimensions (world units)
    this.width  = 0.7;
    this.height = 1.4;

    // 3D lane positions
    this.lanes       = LANE_X;
    this.z           = PLAYER_Z;
    this.currentLane = 1;

    this.x       = this.lanes[this.currentLane];
    this.targetX = this.x;
    this.y       = 0; // ground level

    this.velocityY = 0;
    this.gravity   = 0.008;

    this.isJumping  = false;
    this.isSliding  = false;

    this.laneSpeed = 0.18; // lerp factor for smooth lane change
  }

  moveLeft() {
    if (!this.game.running) return;
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetX = this.lanes[this.currentLane];
    }
  }

  moveRight() {
    if (!this.game.running) return;
    if (this.currentLane < 2) {
      this.currentLane++;
      this.targetX = this.lanes[this.currentLane];
    }
  }

  jump() {
    if (!this.game.running) return;
    if (!this.isJumping) {
      this.velocityY = 0.185;
      this.isJumping = true;
    }
  }

  slide() {
    if (!this.game.running) return;
    if (!this.isSliding) {
      this.isSliding = true;
      setTimeout(() => { this.isSliding = false; }, 600);
    }
  }

  update() {
    // Smooth lane movement
    this.x += (this.targetX - this.x) * this.laneSpeed;

    // Vertical physics
    this.y         += this.velocityY;
    this.velocityY -= this.gravity;

    if (this.y <= 0) {
      this.y         = 0;
      this.velocityY = 0;
      this.isJumping = false;
    }
  }

}