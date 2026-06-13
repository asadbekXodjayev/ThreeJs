// A minimal trailing ring cursor — disabled on touch / coarse pointers and
// when reduced motion is requested. Pure DOM, no per-frame layout thrash.
export class Cursor {
  constructor() {
    const fine = matchMedia('(pointer: fine)').matches;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    this.dot = document.createElement('div');
    this.ring = document.createElement('div');
    Object.assign(this.dot.style, BASE, {
      width: '5px',
      height: '5px',
      background: '#e9e3d4',
      mixBlendMode: 'difference',
    });
    Object.assign(this.ring.style, BASE, {
      width: '34px',
      height: '34px',
      border: '1px solid rgba(216,177,90,0.6)',
      transition: 'width .3s, height .3s, border-color .3s',
    });
    document.body.append(this.dot, this.ring);

    this.x = innerWidth / 2;
    this.y = innerHeight / 2;
    this.rx = this.x;
    this.ry = this.y;

    addEventListener('pointermove', (e) => {
      this.x = e.clientX;
      this.y = e.clientY;
      this.dot.style.transform = `translate(${this.x - 2.5}px, ${this.y - 2.5}px)`;
    });

    // grow over interactive elements
    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        this.ring.style.width = '54px';
        this.ring.style.height = '54px';
        this.ring.style.borderColor = '#ff3a1d';
      });
      el.addEventListener('pointerleave', () => {
        this.ring.style.width = '34px';
        this.ring.style.height = '34px';
        this.ring.style.borderColor = 'rgba(216,177,90,0.6)';
      });
    });

    this._loop();
  }

  _loop() {
    if (!this.ring) return;
    this.rx += (this.x - this.rx) * 0.16;
    this.ry += (this.y - this.ry) * 0.16;
    const w = parseFloat(this.ring.style.width) || 34;
    this.ring.style.transform = `translate(${this.rx - w / 2}px, ${this.ry - w / 2}px)`;
    requestAnimationFrame(() => this._loop());
  }
}

const BASE = {
  position: 'fixed',
  top: '0',
  left: '0',
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: '90',
  willChange: 'transform',
};
