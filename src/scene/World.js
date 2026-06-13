import * as THREE from 'three';
import { Relic } from './Relic.js';
import { Ash } from './Ash.js';
import { Environment } from './Environment.js';
import { Post } from './Post.js';

// Camera + relic + atmosphere keyframes along the scroll (progress 0 → 1).
// Each chapter is a stop the camera eases between as you descend.
const KEYS = [
  { at: 0.0,  pos: [0, 0.4, 9.5],  look: [0, 0, 0],     ignite: 0.0,  fracture: 0.0,  displace: 0.16, spin: 0.08 },
  { at: 0.25, pos: [4.2, 1.6, 6.0], look: [0, 0.2, 0],   ignite: 0.08, fracture: 0.1,  displace: 0.22, spin: 0.14 },
  { at: 0.5,  pos: [-3.8, -1.2, 5.2], look: [0, 0, 0],   ignite: 0.25, fracture: 0.55, displace: 0.3,  spin: 0.22 },
  { at: 0.75, pos: [0, 0.2, 4.7],   look: [0, 0, 0],     ignite: 1.0,  fracture: 0.8,  displace: 0.42, spin: 0.5 },
  { at: 1.0,  pos: [0, 1.0, 8.0],   look: [0, 0, 0],     ignite: 0.12, fracture: 0.05, displace: 0.18, spin: 0.1 },
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
