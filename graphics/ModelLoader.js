import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Loads GLBs from /public/models (Vite serves as /models/...).
 * Fails soft — caller uses primitive fallbacks.
 */
export async function loadGameModels() {
  const loader = new GLTFLoader();

  const [playerGltf, chaserGltf] = await Promise.all([
    loader.loadAsync('/models/fox.glb'),
    loader.loadAsync('/models/chaser.glb'),
  ]);

  return { playerGltf, chaserGltf };
}
