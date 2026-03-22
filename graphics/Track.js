import * as THREE from 'three';

// Track width covers lanes at -2, 0, +2 plus outer walls
const TRACK_WIDTH  = 8;
const TILE_LENGTH  = 40;
const LANE_POSITIONS = [-2, 0, 2];

function makeGridTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Dark base
  ctx.fillStyle = '#050010'; // Deep dark purple base
  ctx.fillRect(0, 0, size, size);

  // Cyan lane dividers
  ctx.fillStyle = '#00ffff';
  const cW = 4;
  ctx.fillRect(size * 0.33 - cW / 2, 0, cW, size); // Left divider
  ctx.fillRect(size * 0.66 - cW / 2, 0, cW, size); // Right divider

  // Magenta horizontal speed lines
  ctx.fillStyle = '#ff0066';
  for (let i = 0; i < size; i += (size / 12)) {
    ctx.fillRect(0, i, size, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  return tex;
}

export default class Track {

  constructor(scene) {

    const gridTex = makeGridTexture();

    this.trackMaterial = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.1,   // Highly glossy
      metalness: 0.6,   // Reflective
      emissive: new THREE.Color(0x050010),
      emissiveIntensity: 0.2
    });

    const floorGeo = new THREE.PlaneGeometry(TRACK_WIDTH, TILE_LENGTH);

    // Two tiles that leap-frog to create an infinite-scroll illusion
    this._tiles = [];
    for (let i = 0; i < 2; i++) {
      const mesh = new THREE.Mesh(floorGeo, this.trackMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, -0.01, -TILE_LENGTH / 2 - TILE_LENGTH * i);
      mesh.receiveShadow = true;
      scene.add(mesh);
      this._tiles.push(mesh);
    }

    // Left and right outer wall glow strips
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: new THREE.Color(0x002244),
      emissiveIntensity: 1,
      side: THREE.FrontSide,
    });

    const wallGeo = new THREE.PlaneGeometry(0.5, TILE_LENGTH * 2);
    const wallL = new THREE.Mesh(wallGeo, wallMat);
    wallL.rotation.y = Math.PI / 2;
    wallL.position.set(-TRACK_WIDTH / 2, 0.5, -TILE_LENGTH);
    scene.add(wallL);

    const wallR = wallL.clone();
    wallR.rotation.y = -Math.PI / 2;
    wallR.position.set(TRACK_WIDTH / 2, 0.5, -TILE_LENGTH);
    scene.add(wallR);

    // Lane divider lines (emissive strips)
    const dividerMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const dividerGeo = new THREE.BoxGeometry(0.04, 0.02, TILE_LENGTH * 2);

    // Two dividers between the three lanes
    [-1, 1].forEach(xOffset => {
      const div = new THREE.Mesh(dividerGeo, dividerMat);
      div.position.set(xOffset, 0.01, -TILE_LENGTH);
      scene.add(div);
    });

    // Edge rails
    [-TRACK_WIDTH / 2, TRACK_WIDTH / 2].forEach(xEdge => {
      const rail = new THREE.Mesh(dividerGeo, dividerMat.clone());
      (rail.material).color.set(0x330066);
      rail.position.set(xEdge, 0.01, -TILE_LENGTH);
      scene.add(rail);
    });
  }

  /**
   * Called every frame with the game scroll speed (world units/frame)
   */
  update(speed) {
    for (const tile of this._tiles) {
      tile.position.z += speed;

      // When a tile passes the camera, wrap it back to the far end
      if (tile.position.z > TILE_LENGTH / 2) {
        tile.position.z -= TILE_LENGTH * 2;
      }
    }
  }

}