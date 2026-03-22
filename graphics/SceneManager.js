import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import CityEnvironment from './CityEnvironment.js';

export default class SceneManager {

  constructor() {

    // ── Scene ──────────────────────────────────────────────
    this.scene = new THREE.Scene();

    // Deep synthwave purple background
    const bgHex = 0x070014;
    this.scene.background = new THREE.Color(bgHex);
    // Linear fog for a stronger horizon fade
    this.scene.fog = new THREE.Fog(bgHex, 20, 100);

    // ── Camera ─────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      220
    );
    this.camera.position.set(0, 4, 10);
    this.camera.lookAt(0, 1, -8);

    // ── Renderer ───────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0; // Slightly darker base
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameContainer').appendChild(this.renderer.domElement);

    // ── Lighting: Curated Synthwave Palette ─────────────────
    // Dark indigo ambient/hemisphere
    const hemi = new THREE.HemisphereLight(0x110033, 0x04000a, 0.4);
    this.scene.add(hemi);

    const ambient = new THREE.AmbientLight(0x0a001a, 1.0);
    this.scene.add(ambient);

    // Cyan rim on left
    const cyanLight = new THREE.PointLight(0x00ffff, 12, 50);
    cyanLight.position.set(-8, 6, 2);
    this.scene.add(cyanLight);

    // Hot pink core on right
    const pinkLight = new THREE.PointLight(0xff0066, 10, 45);
    pinkLight.position.set(8, 5, -2);
    this.scene.add(pinkLight);

    // Subtle blue moon key light for shadows
    const keyLight = new THREE.DirectionalLight(0x2244aa, 0.6);
    keyLight.position.set(-2, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width  = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near   = 1;
    keyLight.shadow.camera.far    = 40;
    keyLight.shadow.camera.left   = -12;
    keyLight.shadow.camera.right  = 12;
    keyLight.shadow.camera.top    = 12;
    keyLight.shadow.camera.bottom = -12;
    this.scene.add(keyLight);

    // ── Starfield ──────────────────────────────────────────
    this._buildStarfield();

    // ── City environment ───────────────────────────────────
    this._city = new CityEnvironment(this.scene);

    // ── Post-processing (Bloom) ────────────────────────────
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.05,   // strength
      0.45,   // radius
      0.10    // threshold
    );
    this.composer.addPass(bloom);

    // ── Resize ─────────────────────────────────────────────
    window.addEventListener('resize', () => this._onResize());

    // ── Camera animation state ─────────────────────────────
    this._cameraTargetX = 0;
    this._cameraSway    = 0;
  }

  _buildStarfield() {
    const count = 600;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spread stars in a wide hemisphere behind and around the track
      positions[i * 3]     = (Math.random() - 0.5) * 180;
      positions[i * 3 + 1] = 10 + Math.random() * 60;
      positions[i * 3 + 2] = -20 - Math.random() * 160;

      // Mostly rich colors: hot pink, cyan, and off-white
      const r = Math.random();
      if (r < 0.2) { // Hot pink
        colors[i * 3]     = 1.0;
        colors[i * 3 + 1] = 0.0;
        colors[i * 3 + 2] = 0.6;
      } else if (r < 0.4) { // Cyan
        colors[i * 3]     = 0.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else { // Dim bluish-white
        colors[i * 3]     = 0.5 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const mat = new THREE.PointsMaterial({
      size:            0.25,
      vertexColors:    true,
      transparent:     true,
      opacity:         0.85,
      depthWrite:      false,
      sizeAttenuation: true,
    });

    this._stars = new THREE.Points(geo, mat);
    this.scene.add(this._stars);
  }

  /**
   * Smoothly sway camera to follow player's lane (x = -2, 0, or 2)
   */
  setCameraTarget(targetX) {
    this._cameraTargetX = targetX * 0.25;
  }

  render(deltaTime) {
    // Smooth camera sway
    this._cameraSway += (this._cameraTargetX - this._cameraSway) * 0.05;
    this.camera.position.x = this._cameraSway;

    // Slowly drift stars for subtle parallax
    if (this._stars) {
      this._stars.position.x = this._cameraSway * -0.3;
    }

    // Blink antenna tips
    this._city.update();

    this.composer.render();
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

}