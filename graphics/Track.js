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
  const c = canvas.getContext('2d');

  // Dark base
  c.fillStyle = '#03001a';
  c.fillRect(0, 0, size, size);

  // Grid lines — cyan, faint
  c.strokeStyle = 'rgba(0,255,255,0.25)';
  c.lineWidth = 1;

  const step = size / 8;
  for (let i = 0; i <= size; i += step) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i, size);
    c.stroke();

    c.beginPath();
    c.moveTo(0, i);
    c.lineTo(size, i);
    c.stroke();
  }

  // Brighter horizontal lines for depth
  c.strokeStyle = 'rgba(0,255,255,0.55)';
  c.lineWidth   = 2;
  for (let i = 0; i <= size; i += step) {
    c.beginPath();
    c.moveTo(0, i);
    c.lineTo(size, i);
    c.stroke();
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

    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.8,
      metalness: 0.1,
      emissiveMap: gridTex,
      emissive: new THREE.Color(0x001133),
      emissiveIntensity: 0.4,
    });

    const floorGeo = new THREE.PlaneGeometry(TRACK_WIDTH, TILE_LENGTH);

    // Two tiles that leap-frog to create an infinite-scroll illusion
    this._tiles = [];
    for (let i = 0; i < 2; i++) {
      const mesh = new THREE.Mesh(floorGeo, floorMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, -0.01, -TILE_LENGTH / 2 - TILE_LENGTH * i);
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