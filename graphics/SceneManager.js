import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export default class SceneManager {

  constructor() {

    // ── Scene ──────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050010);
    this.scene.fog = new THREE.FogExp2(0x050010, 0.025);

    // ── Camera ─────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    // Third-person runner view: slightly above and behind the player
    this.camera.position.set(0, 4, 10);
    this.camera.lookAt(0, 1, -8);

    // ── Renderer ───────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    document.getElementById('gameContainer').appendChild(this.renderer.domElement);

    // ── Lighting ───────────────────────────────────────────
    // Soft ambient fill
    const ambient = new THREE.AmbientLight(0x111133, 2);
    this.scene.add(ambient);

    // Cyan neon fill from above-left
    const cyanLight = new THREE.PointLight(0x00ffff, 6, 30);
    cyanLight.position.set(-4, 6, 2);
    this.scene.add(cyanLight);

    // Magenta neon fill from above-right
    const magentaLight = new THREE.PointLight(0xff00cc, 4, 30);
    magentaLight.position.set(4, 6, 2);
    this.scene.add(magentaLight);

    // Subtle forward key fill
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.5);
    keyLight.position.set(0, 8, 10);
    this.scene.add(keyLight);

    // ── Post-processing (Bloom) ────────────────────────────
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.1,   // strength
      0.5,   // radius
      0.1    // threshold (low = glows everything bright)
    );
    this.composer.addPass(bloom);

    // ── Resize handler ─────────────────────────────────────
    window.addEventListener('resize', () => this._onResize());

    // ── Camera animation state ─────────────────────────────
    this._cameraTargetX = 0;
    this._cameraSway = 0;
  }

  /**
   * Smoothly sway camera to follow player's lane (x = -2, 0, or 2)
   */
  setCameraTarget(targetX) {
    this._cameraTargetX = targetX * 0.25; // subtle follow, not full lane tracking
  }

  render(deltaTime) {
    // Smooth camera sway
    this._cameraSway += (this._cameraTargetX - this._cameraSway) * 0.05;
    this.camera.position.x = this._cameraSway;

    this.composer.render();
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

}