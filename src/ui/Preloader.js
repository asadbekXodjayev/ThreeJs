// A short, deterministic "forging" preloader. There are no heavy assets to
// wait on (everything is procedural), so this animates a believable progress
// curve, then resolves — giving the WebGL a beat to warm up first frames.
export class Preloader {
  constructor() {
    this.el = document.getElementById('preloader');
    this.fill = document.getElementById('preloader-fill');
    this.pct = document.getElementById('preloader-pct');
  }

  run() {
    return new Promise((resolve) => {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        this._set(100);
        this._finish(resolve);
        return;
      }
      // Time-based (not frame-based) so it always completes in ~1.8s even when
      // the WebGL loop starves rAF on a slow GPU/software renderer.
      const DURATION = 1800;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / DURATION);
        // ease-out cubic for a confident finish
        const eased = 1 - Math.pow(1 - t, 3);
        this._set(eased * 100);
        if (t >= 1) {
          setTimeout(() => this._finish(resolve), 320);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  _set(p) {
    const v = Math.min(100, Math.round(p));
    if (this.fill) this.fill.style.width = v + '%';
    if (this.pct) this.pct.textContent = v;
  }

  _finish(resolve) {
    this.el?.classList.add('is-done');
    resolve();
  }
}
