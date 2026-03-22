import Game          from './game/Game.js';
import SceneManager  from './graphics/SceneManager.js';
import { loadGameModels } from './graphics/ModelLoader.js';

// ── Boot (async: load GLBs before gameplay) ─────────────────────────────────
async function boot() {
  const sceneManager = new SceneManager();

  let models = null;
  try {
    models = await loadGameModels();
  } catch (err) {
    console.warn('Cyber Runner: GLTF load failed — using fallback meshes.', err);
  }

  const game = new Game(sceneManager, models);

  let lastTime = 0;

  function gameLoop(timestamp) {
    const deltaTime = Math.min(timestamp - lastTime, 50);
    lastTime = timestamp;

    game.update(deltaTime);
    sceneManager.render(deltaTime);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

boot();
