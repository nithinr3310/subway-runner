/**
 * Collision — 3D AABB helpers.
 *
 * Player is at (player.x, player.y+height/2), in lane player.currentLane.
 * Objects are at their laneIndex and z position.
 */

import {
  LANE_X,
  PLAYER_Z,
  PLAYER_Z_NEAR,
  PLAYER_Z_FAR,
} from './WorldConfig.js';

/**
 * Obstacle collision:
 * - Lane must match (or be close enough in X)
 * - Z ranges must overlap (player is at z ≈ PLAYER_Z)
 */
export function checkObstacleCollision(player, obstacle) {
  const PLAYER_HALF = player.width / 2;
  const OBS_HALF    = obstacle.width / 2;

  const playerX   = player.x;
  const obstacleX = LANE_X[obstacle.laneIndex];

  const xOverlap = Math.abs(playerX - obstacleX) < (PLAYER_HALF + OBS_HALF - 0.05);

  // For slide obstacles the player must be standing (not sliding) to be hit
  if (obstacle.isSlide && player.isSliding) return false;

  // For tall obstacles the player must not be jumping over them
  const playerTop   = player.y + player.height;
  const obstacleTop = obstacle.height;
  const yOverlap    = player.y < obstacleTop && playerTop > 0;

  const zOverlap =
    obstacle.z > PLAYER_Z - PLAYER_Z_NEAR &&
    obstacle.z < PLAYER_Z + PLAYER_Z_FAR;

  return xOverlap && yOverlap && zOverlap;
}

/**
 * Coin / power-up collection (lane + Z proximity):
 */
export function checkPickupCollision(player, item) {
  const playerX = player.x;
  const itemX   = LANE_X[item.laneIndex];

  const xClose = Math.abs(playerX - itemX) < 1.1;
  const zClose =
    item.z > PLAYER_Z - 1.2 && item.z < PLAYER_Z + 1.2;

  return xClose && zClose;
}

/**
 * Chaser enemy — same Z window as obstacles; tall hit volume so jumps do not trivially clear it.
 *
 * BUG FIX: check enemy.isGrace first — no collision fires during the post-reset grace period.
 * X threshold tightened (0.68 vs old 0.85) to give the player a fair window after lane switch.
 */
export function checkEnemyCollision(player, enemy) {
  // Grace period suppresses collision right after enemy resets
  if (enemy.isGrace) return false;

  const PLAYER_HALF = player.width / 2;
  const ENEMY_HALF  = enemy.width / 2;

  // Tighter threshold (0.68 vs old 0.85) — prevents phantom hits mid-lane-change
  const xOverlap =
    Math.abs(player.x - enemy.x) < (PLAYER_HALF + ENEMY_HALF - 0.22);

  const playerTop = player.y + player.height;
  const yOverlap =
    player.y < enemy.hitHeight && playerTop > 0;

  const zOverlap =
    enemy.z > PLAYER_Z - PLAYER_Z_NEAR &&
    enemy.z < PLAYER_Z + PLAYER_Z_FAR;

  return xOverlap && yOverlap && zOverlap;
}

export default checkObstacleCollision;
