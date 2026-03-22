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
import {
  checkEnemyCollision,
  checkObstacleCollision,
  checkPickupCollision,
} from './Collision.js';
import ChaserEnemy from './ChaserEnemy.js';
import EnemyMesh from '../graphics/EnemyMesh.js';

export default class Game {

  constructor(sceneManager, models = null) {

    this.sceneManager = sceneManager;
    const scene = sceneManager.scene;

    // ── State ─────────────────────────────────────────────
    this.running    = false;
    this.score      = 0;
    this.coinCount  = 0;
    this.speed      = 5;
    this.bestScore  = parseInt(localStorage.getItem('cyberRunnerBest') || '0', 10);

    // Power-up flags
    this.magnetActive = false;
    this.magnetTimer  = 0;

    this.shieldActive = false;
    this.shieldTimer  = 0;   // frames; 0 = permanent until hit

    this.dashActive = false;
    this.dashTimer  = 0;
    this._baseSpeed = 5;

    // ── Logic managers ────────────────────────────────────
    this.player    = new Player(this);
    this.obstacles = new ObstacleManager(this);
    this.coins     = new CoinManager(this);
    this.powerUps  = new PowerUpManager(this);
    this.chaser    = new ChaserEnemy(this);

    // ── Graphics managers ─────────────────────────────────
    this.track        = new Track(scene);
    this.playerMesh   = new PlayerMesh(scene, models);
    this.obstacleMesh = new ObstacleMesh(scene);
    this.coinMesh     = new CoinMesh(scene);
    this.powerUpMesh  = new PowerUpMesh(scene);
    this.particles    = new ParticleSystem(scene);
    this.enemyMesh    = new EnemyMesh(scene, models);

    // ── Input ─────────────────────────────────────────────
    new InputHandler(this);

    // ── UI bindings ───────────────────────────────────────
    this._elScore      = document.getElementById('score');
    this._elCoins      = document.getElementById('coins');
    this._elSpeed      = document.getElementById('speedValue');
    this._elMagnet     = document.getElementById('magnetIndicator');
    this._elShield     = document.getElementById('shieldIndicator');
    this._elDash       = document.getElementById('dashIndicator');
    this._elStart      = document.getElementById('startScreen');
    this._elGameOver   = document.getElementById('gameOverScreen');
    this._elFinalScore = document.getElementById('finalScore');
    this._elFinalCoins = document.getElementById('finalCoins');
    this._elBest       = document.getElementById('bestScore');

    document.getElementById('restartBtn')
      .addEventListener('click', () => this.restartGame());
    document.getElementById('startBtn')
      .addEventListener('click', () => this.startGame());

    document.getElementById('gameContainer')
      .addEventListener('touchstart', () => {
        if (this.running) return;
        if (this._elGameOver.classList.contains('hidden')) {
          this.startGame();
        } else {
          this.restartGame();
        }
      }, { passive: true });

    this._setupStart();
    this._elBest.textContent = this.bestScore;
    this._elapsedTime = 0;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  _setupStart() {
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Space' || this.running) return;
      e.preventDefault();
      if (this._elGameOver.classList.contains('hidden')) {
        this.startGame();
      } else {
        this.restartGame();
      }
    });
  }

  startGame() {
    this.chaser.reset();
    this.running = true;
    this._elStart.style.display = 'none';
  }

  restartGame() {
    this.running   = false;
    this.score     = 0;
    this.coinCount = 0;
    this.speed     = 5;
    this._baseSpeed = 5;

    this.obstacles.obstacles = [];
    this.obstacles.spawnTimer = 0;
    this.coins.coins          = [];
    this.coins.spawnTimer     = 0;
    this.powerUps.powerUps    = [];
    this.powerUps.spawnTimer  = 0;

    this.magnetActive = false;
    this.magnetTimer  = 0;
    this.shieldActive = false;
    this.shieldTimer  = 0;
    this.dashActive   = false;
    this.dashTimer    = 0;

    this.player.currentLane = 1;
    this.player.x           = this.player.lanes[1];
    this.player.targetX     = this.player.x;
    this.player.y           = 0;
    this.player.velocityY   = 0;
    this.player.isJumping   = false;
    this.player.isSliding   = false;

    this.chaser.reset();

    this._elGameOver.classList.add('hidden');
    this._elBest.textContent = this.bestScore;
    this._hideAllHUD();

    this.running = true;
  }

  _hideAllHUD() {
    this._elMagnet.classList.add('hidden');
    this._elShield.classList.add('hidden');
    this._elDash.classList.add('hidden');
  }

  // ── Per-Frame Update ─────────────────────────────────────────────────────

  update(deltaTime) {
    if (!this.running) return;

    this._elapsedTime += deltaTime * 0.001;

    // Score + difficulty ramp
    this.score     += this.speed * 0.05;
    this._baseSpeed = 5 + Math.floor(this.score / 200);

    // Dash speed boost (separate from base speed)
    if (this.dashActive) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.dashActive = false;
        this.speed = this._baseSpeed;
        this._elDash.classList.add('hidden');
      } else {
        // Keep boosted speed
        this.speed = this._baseSpeed * 1.65;
      }
    } else {
      this.speed = this._baseSpeed;
    }

    // Magnet timer
    if (this.magnetActive) {
      this.magnetTimer--;
      if (this.magnetTimer <= 0) {
        this.magnetActive = false;
        this._elMagnet.classList.add('hidden');
      }
    }

    // Shield timer (optional expiry after ~15s = 900 frames)
    if (this.shieldActive) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        this._elShield.classList.add('hidden');
      }
    }

    // ── Logic updates ──────────────────────────────────────
    this.player.update();
    this.obstacles.update();
    this.coins.update();
    this.powerUps.update();
    this.chaser.update();

    // ── Collision detection ────────────────────────────────
    this._checkCollisions();

    // ── Sync 3D graphics ───────────────────────────────────
    this.track.update(this.speed * 0.1);
    this.playerMesh.update(this.player, deltaTime);
    this.obstacleMesh.update(this.obstacles.obstacles);
    this.coinMesh.update(this.coins.coins, this._elapsedTime);
    this.powerUpMesh.update(this.powerUps.powerUps, this._elapsedTime);
    this.enemyMesh.update(this.chaser, deltaTime);
    this.particles.update();

    // Camera sway
    this.sceneManager.setCameraTarget(this.player.x);

    // Magnet spark effect
    if (this.magnetActive) {
      this.particles.emitMagnetPull(this.player.x, this.player.y, this.player.z);
    }

    // Dash trail
    if (this.dashActive) {
      this.particles.emitDashTrail(this.player.x, this.player.y, this.player.z);
    }

    // ── HUD ────────────────────────────────────────────────
    this._elScore.textContent = Math.floor(this.score);
    this._elCoins.textContent = this.coinCount;
    this._elSpeed.textContent = Math.floor(this.speed / 5);
  }

  // ── Collision helpers ─────────────────────────────────────────────────────

  _checkCollisions() {

    // Obstacles → death (or shield absorb)
    for (const obs of this.obstacles.obstacles) {
      if (checkObstacleCollision(this.player, obs)) {
        if (this.shieldActive) {
          this._absorbHit();
        } else {
          this._onDeath();
        }
        return;
      }
    }

    // Chaser → death (or shield absorb)
    if (checkEnemyCollision(this.player, this.chaser)) {
      if (this.shieldActive) {
        this._absorbHit();
      } else {
        this._onDeath();
      }
      return;
    }

    // Coins → collect
    for (const coin of [...this.coins.coins]) {
      if (checkPickupCollision(this.player, coin)) {
        this.coinCount++;
        this.coins.removeCoin(coin.id);
        this.particles.emitCoinCollect(this.player.x, this.player.y, this.player.z);
      }
    }

    // Power-ups → activate
    for (const pu of [...this.powerUps.powerUps]) {
      if (checkPickupCollision(this.player, pu)) {
        this._activatePowerUp(pu.type);
        this.powerUps.removePowerUp(pu.id);
      }
    }
  }

  _activatePowerUp(type) {
    if (type === 'magnet') {
      this.magnetActive = true;
      this.magnetTimer  = 350;
      this._elMagnet.classList.remove('hidden');
    } else if (type === 'shield') {
      this.shieldActive = true;
      this.shieldTimer  = 900; // 15 seconds at 60fps
      this._elShield.classList.remove('hidden');
    } else if (type === 'dash') {
      this.dashActive = true;
      this.dashTimer  = 240; // 4 seconds
      this._elDash.classList.remove('hidden');
    }
  }

  _absorbHit() {
    // Shield soaks one hit
    this.shieldActive = false;
    this.shieldTimer  = 0;
    this._elShield.classList.add('hidden');

    // Shockwave-like blast particle feedback
    this.particles.emitShieldBurst(this.player.x, this.player.y, this.player.z);

    // Push the chaser back so it can't instantly re-collide
    this.chaser.z = -22;
    this.chaser._graceTick = 80;
  }

  _onDeath() {
    this.running = false;

    this.particles.emitDeath(this.player.x, this.player.y, this.player.z);

    if (Math.floor(this.score) > this.bestScore) {
      this.bestScore = Math.floor(this.score);
      localStorage.setItem('cyberRunnerBest', this.bestScore);
    }

    this._elFinalScore.textContent = Math.floor(this.score);
    this._elFinalCoins.textContent = this.coinCount;
    this._elBest.textContent       = this.bestScore;
    this._elGameOver.classList.remove('hidden');
    this._hideAllHUD();
  }

}