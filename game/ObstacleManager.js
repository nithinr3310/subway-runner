/**
 * ObstacleManager — pure game logic in 3D world units.
 *
 * Each obstacle:
 *   { id, laneIndex (0/1/2), z (world Z), width, height, isSlide }
 *
 * Obstacles spawn at z = -50 and travel toward +Z (camera) at game speed.
 * Removed when they pass z = +6 (behind camera).
 */
let _nextId = 0;

export default class ObstacleManager {

  constructor(game) {
    this.game = game;
    this.obstacles   = [];
    this.spawnTimer  = 0;

    // Pattern: which lanes (0=left,1=center,2=right) to block
    this.patterns = [
      [1, 0, 1],  // block left + right → must go center
      [0, 1, 0],  // block center       → must go left or right
      [1, 0, 0],  // block left only
      [0, 0, 1],  // block right only
      [1, 1, 0],  // block left+center
      [0, 1, 1],  // block center+right
    ];

    // Gap between spawn events in frames (decreases with score)
    this._baseInterval = 120;
  }

  spawnObstacle() {
    const pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
    const isSlide = Math.random() < 0.2; // 20% chance of slide obstacles

    for (let lane = 0; lane < 3; lane++) {
      if (pattern[lane] === 1) {
        this.obstacles.push({
          id:        _nextId++,
          laneIndex: lane,
          z:         -52,
          width:     1.1,
          height:    isSlide ? 0.6 : 1.4,
          isSlide,
        });
      }
    }
  }

  update() {
    this.spawnTimer++;

    // Spawn faster as speed increases
    const interval = Math.max(60, this._baseInterval - Math.floor(this.game.score / 300) * 8);

    if (this.spawnTimer >= interval) {
      this.spawnObstacle();
      this.spawnTimer = 0;
    }

    const speed = this.game.speed * 0.1; // convert to world units/frame

    for (const obs of this.obstacles) {
      obs.z += speed;
    }

    // Remove obstacles that have passed the camera
    this.obstacles = this.obstacles.filter(obs => obs.z < 6);
  }

}