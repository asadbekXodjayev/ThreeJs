import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Smooth scroll (Lenis) wired into GSAP ScrollTrigger, plus all the
// scroll-linked DOM choreography: text reveals, nav state, and the single
// page-wide progress value that drives the 3D camera.
export class Scroll {
  constructor({ onProgress }) {
    this.onProgress = onProgress;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !this.reduced,
      syncTouch: false,
    });

    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => this.lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // page-wide progress → 3D world
    ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => this.onProgress(self.progress),
    });

    this._reveals();
    this._nav();
    this._buttons();
  }

  // staggered entrance for every [data-reveal] as it enters view
  _reveals() {
    const items = gsap.utils.toArray('[data-reveal]');
    items.forEach((el) => {
      gsap.set(el, { opacity: 0, y: this.reduced ? 0 : 34, filter: 'blur(6px)' });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.1,
            ease: 'power3.out',
          });
        },
      });
    });

    // hero title letters rise on load (handled here so it fires after preloader)
    this.heroLetters = gsap.utils.toArray('.panel__title span');
  }

  playHero() {
    if (this.reduced || !this.heroLetters?.length) return;
    gsap.from(this.heroLetters, {
      yPercent: 120,
      opacity: 0,
      duration: 1.4,
      ease: 'power4.out',
      stagger: 0.08,
      delay: 0.2,
    });
  }

  _nav() {
    const links = gsap.utils.toArray('[data-nav]');
    links.forEach((link) => {
      const id = link.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.lenis.scrollTo(target, { offset: 0 });
      });
      ScrollTrigger.create({
        trigger: target,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => link.classList.toggle('is-active', self.isActive),
      });
    });
  }

  _buttons() {
    const toTop = document.querySelector('[data-totop]');
    toTop?.addEventListener('click', () => this.lenis.scrollTo(0));
  }

  refresh() {
    ScrollTrigger.refresh();
  }
}
