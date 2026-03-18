/**
 * Collision — 3D AABB helpers.
 *
 * Player is at (player.x, player.y+height/2), in lane player.currentLane.
 * Objects are at their laneIndex and z position.
 */

const LANE_X = [-2, 0, 2];

/**
 * Obstacle collision:
 * - Lane must match (or be close enough in X)
 * - Z ranges must overlap (player is at z ≈ 2)
 */
export function checkObstacleCollision(player, obstacle) {
  const PLAYER_Z     = 2;     // fixed Z where the player stands
  const PLAYER_HALF  = player.width / 2;
  const OBS_HALF     = obstacle.width / 2;

  const playerX  = player.x;
  const obstacleX = LANE_X[obstacle.laneIndex];

  const xOverlap = Math.abs(playerX - obstacleX) < (PLAYER_HALF + OBS_HALF - 0.05);

  // For slide obstacles the player must be standing (not sliding) to be hit
  if (obstacle.isSlide && player.isSliding) return false;

  // For tall obstacles the player must not be jumping over them
  const playerTop    = player.y + player.height;
  const obstacleTop  = obstacle.height;
  const yOverlap     = player.y < obstacleTop && playerTop > 0;

  const zOverlap = obstacle.z > PLAYER_Z - 1.0 && obstacle.z < PLAYER_Z + 0.8;

  return xOverlap && yOverlap && zOverlap;
}

/**
 * Coin / power-up collection (lane + Z proximity):
 */
export function checkPickupCollision(player, item) {
  const PLAYER_Z   = 2;
  const playerX    = player.x;
  const itemX      = LANE_X[item.laneIndex];

  const xClose = Math.abs(playerX - itemX) < 1.1;
  const zClose = item.z > PLAYER_Z - 1.2 && item.z < PLAYER_Z + 1.2;

  return xClose && zClose;
}

// Legacy default export kept for any remaining direct imports
export default checkObstacleCollision;