// A synthesized dark ambient drone — no audio asset, generated with the Web
// Audio API and started only on a user gesture (respects autoplay policy).
// Two detuned low oscillators + a slow filter sweep + a faint bell on toggle.
export class Sound {
  constructor() {
    this.btn = document.getElementById('sound-toggle');
    this.label = this.btn?.querySelector('.chrome__sound-label');
    this.on = false;
    this.ctx = null;
    this.btn?.addEventListener('click', () => this.toggle());
  }

  _build() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 6;
    filter.connect(master);

    // slow LFO opening/closing the filter — the "breathing" of the void
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    // two detuned drones an octave apart
    [55, 55.4, 110, 82.5].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i < 2 ? 'sawtooth' : 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i < 2 ? 0.16 : 0.1;
      osc.connect(g).connect(filter);
      osc.start();
    });
  }

  toggle() {
    if (!this.ctx) this._build();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.on = !this.on;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.on ? 0.5 : 0, now + (this.on ? 2.5 : 1.2));

    this.btn.classList.toggle('is-on', this.on);
    this.btn.setAttribute('aria-pressed', String(this.on));
    if (this.label) this.label.textContent = this.on ? 'resound' : 'silence';
  }
}
