import Game         from './game/Game.js';
import SceneManager  from './graphics/SceneManager.js';

// ── Boot ─────────────────────────────────────────────────────────────────────
const sceneManager = new SceneManager();
const game         = new Game(sceneManager);

// ── Game Loop ─────────────────────────────────────────────────────────────────
let lastTime = 0;

function gameLoop(timestamp) {
  const deltaTime = Math.min(timestamp - lastTime, 50); // cap at 50ms to avoid spiral of death
  lastTime = timestamp;

  game.update(deltaTime);
  sceneManager.render(deltaTime);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);