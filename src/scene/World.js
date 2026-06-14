import * as THREE from 'three';
import { Relic } from './Relic.js';
import { Ash } from './Ash.js';
import { Environment } from './Environment.js';
import { Post } from './Post.js';

// Camera + relic + atmosphere keyframes along the scroll (progress 0 → 1).
// Each chapter is a stop the camera eases between as you descend.
const KEYS = [
  // Hero — the relic at rest in the void
  { at: 0.0,  pos: [0, 0.4, 9.5],    look: [0, 0, 0],   ignite: 0.0,  fracture: 0.0,  displace: 0.16, spin: 0.08 },
  // I · Descent — circle in, first embers wake
  { at: 0.13, pos: [4.2, 1.6, 6.4],  look: [0, 0.2, 0], ignite: 0.07, fracture: 0.08, displace: 0.2,  spin: 0.13 },
  // II · Relic — close pass, cracks spread
  { at: 0.27, pos: [-3.8, -1.0, 5.6], look: [0, 0, 0],  ignite: 0.18, fracture: 0.3,  displace: 0.27, spin: 0.2 },
  // III · Vigil — the indrawn breath: it dims, seals, gathers
  { at: 0.42, pos: [2.4, -1.6, 5.4],  look: [0, 0, 0],  ignite: 0.09, fracture: 0.16, displace: 0.21, spin: 0.09 },
  // IV · Reckoning — the furnace opens
  { at: 0.56, pos: [-2.2, 0.6, 4.7],  look: [0, 0, 0],  ignite: 0.45, fracture: 0.52, displace: 0.34, spin: 0.28 },
  // V · Unmaking — THE PUSH: everything tears loose, the relic becomes a sun
  { at: 0.73, pos: [0, 0.0, 3.7],     look: [0, 0, 0],  ignite: 1.0,  fracture: 1.0,  displace: 0.52, spin: 0.78 },
  // aftershock — camera recoils, embers still raging
  { at: 0.85, pos: [0, -0.5, 6.8],    look: [0, 0, 0],  ignite: 0.62, fracture: 0.4,  displace: 0.34, spin: 0.34 },
  // VI · Eternity — shards settle, the relic forgets
  { at: 1.0,  pos: [0, 1.0, 8.6],     look: [0, 0, 0],  ignite: 0.12, fracture: 0.05, displace: 0.18, spin: 0.1 },
];

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.quality = detectQuality();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // SMAA handled in post on capable devices
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(innerWidth, innerHeight);
    this.dpr = Math.min(devicePixelRatio || 1, this.quality === 'high' ? 2 : 1.5);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 200);
    this.camera.position.set(0, 0.4, 9.5);

    const ashCount = this.quality === 'low' ? 900 : this.quality === 'mid' ? 1800 : 2800;

    this.env = new Environment().applyTo(this.scene);
    this.relic = new Relic(this.quality).addTo(this.scene);
    this.ash = new Ash(ashCount, this.dpr).addTo(this.scene);
    this.post = new Post(this.renderer, this.scene, this.camera, this.quality);

    this.clock = new THREE.Clock();
    this.progress = 0;
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this._camLook = new THREE.Vector3();
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._onResize = this.resize.bind(this);
    addEventListener('resize', this._onResize);
    addEventListener('pointermove', (e) => {
      this.pointer.tx = (e.clientX / innerWidth) * 2 - 1;
      this.pointer.ty = (e.clientY / innerHeight) * 2 - 1;
    });
  }

  // called by the scroll controller, progress in [0,1]
  setProgress(p) {
    this.progress = Math.max(0, Math.min(1, p));
  }

  _applyKeyframes() {
    const p = this.progress;
    let a = KEYS[0];
    let b = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (p >= KEYS[i].at && p <= KEYS[i + 1].at) {
        a = KEYS[i];
        b = KEYS[i + 1];
        break;
      }
    }
    const span = b.at - a.at || 1;
    const t = smoothstep((p - a.at) / span);

    // ease camera toward the interpolated keyframe (extra lerp = silky)
    const px = lerp(a.pos[0], b.pos[0], t);
    const py = lerp(a.pos[1], b.pos[1], t);
    const pz = lerp(a.pos[2], b.pos[2], t);
    const k = this.reducedMotion ? 1 : 0.05;
    this.camera.position.x += (px + this.pointer.x * 0.5 - this.camera.position.x) * k;
    this.camera.position.y += (py - this.pointer.y * 0.4 - this.camera.position.y) * k;
    this.camera.position.z += (pz - this.camera.position.z) * k;

    this._camLook.set(
      lerp(a.look[0], b.look[0], t),
      lerp(a.look[1], b.look[1], t),
      lerp(a.look[2], b.look[2], t)
    );
    this.camera.lookAt(this._camLook);

    // distribute energy to every system
    const ignite = lerp(a.ignite, b.ignite, t);
    this.relic.target.ignite = ignite;
    this.relic.target.fracture = lerp(a.fracture, b.fracture, t);
    this.relic.target.displace = lerp(a.displace, b.displace, t);
    this.relic.target.spin = lerp(a.spin, b.spin, t);
    this.ash.target.ignite = ignite;
    this.env.target.ignite = ignite;
    this.post.target.ignite = ignite;
  }

  start() {
    this.renderer.setAnimationLoop(() => this._frame());
  }

  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.05;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.05;

    this._applyKeyframes();
    this.relic.update(dt, elapsed);
    this.relic.lookToward(this.pointer.x, this.pointer.y);
    this.ash.update(dt, elapsed);
    this.env.update(dt, elapsed);
    this.post.update();
    this.post.render(dt);
  }

  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.post.setSize(innerWidth, innerHeight);
  }

  dispose() {
    removeEventListener('resize', this._onResize);
    this.renderer.setAnimationLoop(null);
    this.relic.dispose();
    this.ash.dispose();
    this.env.dispose();
    this.post.dispose();
    this.renderer.dispose();
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function smoothstep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

// Pick a quality tier from device signals. Conservative on mobile/low-DPR.
function detectQuality() {
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  const small = Math.min(innerWidth, innerHeight) < 720;
  if (mobile && (small || cores <= 4)) return 'low';
  if (mobile || cores <= 4) return 'mid';
  return 'high';
}
