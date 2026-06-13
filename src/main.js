import './style.css';
import { World } from './scene/World.js';
import { Scroll } from './scroll/Scroll.js';
import { Preloader } from './ui/Preloader.js';
import { Cursor } from './ui/Cursor.js';
import { Sound } from './ui/Sound.js';

// Bail to a graceful, still-on-theme fallback if WebGL is unavailable.
function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function fallback() {
  document.getElementById('preloader')?.classList.add('is-done');
  const stage = document.getElementById('stage');
  if (stage) {
    stage.style.background =
      'radial-gradient(120% 90% at 50% 30%, #1a0d0d 0%, #0a0608 45%, #020203 100%)';
  }
  // The HTML narrative still reads beautifully without the relic.
  new Cursor();
}

async function boot() {
  const canvas = document.getElementById('stage');

  if (!webglOK()) {
    fallback();
    return;
  }

  const world = new World(canvas);
  const scroll = new Scroll({ onProgress: (p) => world.setProgress(p) });

  // ambient extras (each self-guards on capability)
  new Cursor();
  new Sound();

  // warm up the render loop behind the preloader
  world.start();

  const preloader = new Preloader();
  await preloader.run();

  // hand the stage to the user
  document.body.classList.add('is-ready');
  scroll.playHero();
  // layout settled after fonts/preloader — recompute trigger positions
  requestAnimationFrame(() => scroll.refresh());
  setTimeout(() => scroll.refresh(), 600);

  if (import.meta.env?.DEV) {
    console.info('%cAETERNUM awakened · quality:', 'color:#d8b15a', world.quality);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
