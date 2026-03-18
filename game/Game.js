import Player          from './Player.js';
import InputHandler     from './InputHandler.js';
import ObstacleManager  from './ObstacleManager.js';
import CoinManager      from './CoinManager.js';
import PowerUpManager   from './PowerUpManager.js';
import Track            from '../graphics/Track.js';
import PlayerMesh       from '../graphics/PlayerMesh.js';
import ObstacleMesh     from '../graphics/ObstacleMesh.js';
import CoinMesh         from '../graphics/CoinMesh.js';
import PowerUpMesh      from '../graphics/PowerUpMesh.js';
import ParticleSystem   from '../graphics/ParticleSystem.js';
import { checkObstacleCollision, checkPickupCollision } from './Collision.js';

export default class Game {

  constructor(sceneManager) {

    this.sceneManager = sceneManager;
    const scene = sceneManager.scene;

    // ── State ────────────────────────────────────────────────
    this.running    = false;
    this.score      = 0;
    this.coinCount  = 0;
    this.speed      = 5;       // arbitrary "pace" units — managers scale to world units
    this.bestScore  = parseInt(localStorage.getItem('cyberRunnerBest') || '0', 10);

    // Power-up flags
    this.magnetActive = false;
    this.magnetTimer  = 0;

    // ── Logic Managers ───────────────────────────────────────
    this.player    = new Player(this);
    this.player.z  = 2; // fixed world Z for collision math
    this.obstacles = new ObstacleManager(this);
    this.coins     = new CoinManager(this);
    this.powerUps  = new PowerUpManager(this);

    // ── Graphics Managers ────────────────────────────────────
    this.track          = new Track(scene);
    this.playerMesh     = new PlayerMesh(scene);
    this.obstacleMesh   = new ObstacleMesh(scene);
    this.coinMesh       = new CoinMesh(scene);
    this.powerUpMesh    = new PowerUpMesh(scene);
    this.particles      = new ParticleSystem(scene);

    // ── Input ────────────────────────────────────────────────
    new InputHandler(this);

    // ── UI bindings ──────────────────────────────────────────
    this._elScore     = document.getElementById('score');
    this._elCoins     = document.getElementById('coins');
    this._elSpeed     = document.getElementById('speedValue');
    this._elMagnet    = document.getElementById('magnetIndicator');
    this._elStart     = document.getElementById('startScreen');
    this._elGameOver  = document.getElementById('gameOverScreen');
    this._elFinalScore= document.getElementById('finalScore');
    this._elFinalCoins= document.getElementById('finalCoins');
    this._elBest      = document.getElementById('bestScore');

    document.getElementById('restartBtn')
      .addEventListener('click', () => this.restartGame());

    // Start on button OR space
    document.getElementById('startBtn')
      .addEventListener('click', () => this.startGame());

    // Also touch support
    document.getElementById('gameContainer')
      .addEventListener('touchstart', (e) => {
        if (!this.running) this.startGame();
      }, { passive: true });

    this._setupStart();
    this._elBest.textContent = this.bestScore;

    // Time tracking for animations
    this._elapsedTime = 0;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  _setupStart() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.running) {
        e.preventDefault();
        this.startGame();
      }
    });
  }

  startGame() {
    this.running = true;
    this._elStart.style.display = 'none';
  }

  restartGame() {
    this.running    = false;

    this.score      = 0;
    this.coinCount  = 0;
    this.speed      = 5;

    this.obstacles.obstacles = [];
    this.obstacles.spawnTimer = 0;
    this.coins.coins          = [];
    this.coins.spawnTimer     = 0;
    this.powerUps.powerUps    = [];
    this.powerUps.spawnTimer  = 0;

    this.magnetActive = false;
    this.magnetTimer  = 0;

    // Reset player
    this.player.currentLane = 1;
    this.player.x           = this.player.lanes[1];
    this.player.targetX     = this.player.x;
    this.player.y           = 0;
    this.player.velocityY   = 0;
    this.player.isJumping   = false;
    this.player.isSliding   = false;

    this._elGameOver.classList.add('hidden');
    this._elBest.textContent = this.bestScore;

    this.running = true;
  }

  // ── Per-Frame Update ─────────────────────────────────────────────────────

  update(deltaTime) {

    if (!this.running) return;

    this._elapsedTime += deltaTime * 0.001; // seconds

    // Score + difficulty ramp
    this.score += this.speed * 0.05;
    this.speed  = 5 + Math.floor(this.score / 200);

    // ── Logic updates ──────────────────────────────────────
    this.player.update();
    this.obstacles.update();
    this.coins.update();
    this.powerUps.update();

    if (this.magnetActive) {
      this.magnetTimer--;
      if (this.magnetTimer <= 0) {
        this.magnetActive = false;
        this._elMagnet.classList.add('hidden');
      }
    }

    // ── Collision detection ────────────────────────────────
    this._checkCollisions();

    // ── Sync 3D graphics ──────────────────────────────────
    this.track.update(this.speed * 0.1);
    this.playerMesh.update(this.player, deltaTime);
    this.obstacleMesh.update(this.obstacles.obstacles);
    this.coinMesh.update(this.coins.coins, this._elapsedTime);
    this.powerUpMesh.update(this.powerUps.powerUps, this._elapsedTime);
    this.particles.update();

    // Camera sway follows player lane
    this.sceneManager.setCameraTarget(this.player.x);

    // Magnet spark effect
    if (this.magnetActive) {
      this.particles.emitMagnetPull(this.player.x, this.player.y, this.player.z);
    }

    // ── HUD ───────────────────────────────────────────────
    this._elScore.textContent = Math.floor(this.score);
    this._elCoins.textContent = this.coinCount;
    this._elSpeed.textContent = Math.floor(this.speed / 5);
  }

  // ── Collision helpers ─────────────────────────────────────────────────────

  _checkCollisions() {

    // Obstacles → death
    for (const obs of this.obstacles.obstacles) {
      if (checkObstacleCollision(this.player, obs)) {
        this._onDeath();
        return;
      }
    }

    // Coins → collect
    for (const coin of [...this.coins.coins]) {
      if (checkPickupCollision(this.player, coin)) {
        this.coinCount++;
        this.coins.removeCoin(coin.id);
        this.particles.emitCoinCollect(
          this.player.x,
          this.player.y,
          this.player.z
        );
      }
    }

    // Power-ups → activate
    for (const pu of [...this.powerUps.powerUps]) {
      if (checkPickupCollision(this.player, pu)) {
        if (pu.type === 'magnet') {
          this.magnetActive = true;
          this.magnetTimer  = 350;
          this._elMagnet.classList.remove('hidden');
        }
        this.powerUps.removePowerUp(pu.id);
      }
    }
  }

  _onDeath() {
    this.running = false;

    // Death particles
    this.particles.emitDeath(this.player.x, this.player.y, this.player.z);

    // Save best
    if (Math.floor(this.score) > this.bestScore) {
      this.bestScore = Math.floor(this.score);
      localStorage.setItem('cyberRunnerBest', this.bestScore);
    }

    // Show game over
    this._elFinalScore.textContent = Math.floor(this.score);
    this._elFinalCoins.textContent = this.coinCount;
    this._elBest.textContent       = this.bestScore;
    this._elGameOver.classList.remove('hidden');
    this._elMagnet.classList.add('hidden');
  }

}