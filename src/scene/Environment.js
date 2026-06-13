import * as THREE from 'three';

// The void: a large inward-facing gradient dome + exponential fog so the relic
// dissolves into darkness at its edges. Procedural gradient = no asset to load.
export class Environment {
  constructor() {
    this.group = new THREE.Group();

    const tex = makeGradientTexture();
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(60, 48, 48),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false })
    );
    this.dome = dome;
    this.group.add(dome);

    // a faint halo disc behind the relic for depth
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(18, 64),
      new THREE.MeshBasicMaterial({
        map: makeHaloTexture(),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    halo.position.z = -14;
    this.halo = halo;
    this.haloMat = halo.material;
    this.group.add(halo);

    this.target = { ignite: 0 };
  }

  applyTo(scene) {
    scene.fog = new THREE.FogExp2(0x050506, 0.022);
    scene.add(this.group);
    return this;
  }

  update(_dt, elapsed) {
    this.dome.rotation.y = elapsed * 0.005;
    const ignite = this.target.ignite;
    // halo warms and brightens during the reckoning
    this.haloMat.opacity += (0.35 + ignite * 0.7 - this.haloMat.opacity) * 0.05;
    this.haloMat.color.setRGB(1, 0.4 - ignite * 0.15, 0.2 + ignite * 0.1);
  }

  dispose() {
    this.dome.geometry.dispose();
    this.dome.material.map?.dispose();
    this.dome.material.dispose();
    this.halo.geometry.dispose();
    this.haloMat.map?.dispose();
    this.haloMat.dispose();
  }
}

function makeGradientTexture() {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, '#0a0608'); // top — faint warm
  g.addColorStop(0.45, '#060508');
  g.addColorStop(0.62, '#0b0709'); // horizon ember whisper
  g.addColorStop(1.0, '#020203'); // floor — near black
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeHaloTexture() {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0, 'rgba(154,17,25,0.9)');
  g.addColorStop(0.35, 'rgba(120,20,15,0.35)');
  g.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
