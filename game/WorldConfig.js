/**
 * Single source of truth for lane positions, scroll tuning, and spawn/despawn Z.
 */

export const LANE_X = [-2, 0, 2];

/** Player anchor in world space (matches PlayerMesh / collision). */
export const PLAYER_Z = 2;

/** game.speed is multiplied by this to get world Z units per frame (obstacles, coins, chaser base scroll). */
export const SCROLL_FACTOR = 0.1;

export const OBSTACLE_SPAWN_Z = -52;
export const PICKUP_SPAWN_Z = -52;
/** Remove world objects when they pass this Z (ahead of camera). */
export const DESPAWN_Z = 6;

/** Depth behind PLAYER_Z (along −Z) for collision window. */
export const PLAYER_Z_NEAR = 1.0;
/** Depth ahead of PLAYER_Z (along +Z) for collision window. */
export const PLAYER_Z_FAR = 0.8;
