# AETERNUM · Memento Mori

> A dark, gothic Three.js scroll-cinematic. A monolithic obsidian relic turns in
> a void of drifting ash, lit from within by molten ember and gold. Scroll to
> descend through five chapters as the relic fractures, ignites, and reassembles.

Built as an award-style interactive piece: custom GLSL shaders, GPU particles,
cinematic post-processing, smooth scroll, and a fully responsive layout from
phone to 4K. **Everything is procedural — there are no external 3D or image
assets**, so nothing can fail to load.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| 3D | [Three.js](https://threejs.org) (vanilla) | smallest bundle, hand-tuned scroll loop |
| Shaders | custom GLSL | obsidian fresnel + ember furnace, ash embers |
| Post | [`postprocessing`](https://github.com/pmndrs/postprocessing) | bloom · chromatic aberration · vignette · grain · SMAA, fused into one pass |
| Scroll | [Lenis](https://github.com/darkroomengineering/lenis) + [GSAP ScrollTrigger](https://gsap.com/scrolltrigger/) | buttery smooth scroll, scrubbed camera + reveals |
| Build | [Vite](https://vitejs.dev) | fast dev, static output |
| Type | Cinzel + Cormorant Garamond | gothic display + classical body |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/  (static, deploy anywhere)
npm run preview    # serve the production build
```

## Features

- **Custom relic shader** — domain-warped fbm displacement, fresnel rim that
  shifts blood → ember → gold, and an inner furnace that opens with scroll.
- **GPU ash field** — thousands of embers drifting in one draw call, warming
  near the core.
- **Scroll-driven camera** — five keyframed chapters interpolated with
  smoothstep easing and pointer parallax.
- **Cinematic post** — HDR bloom, reckoning-driven chromatic aberration,
  vignette, film grain.
- **Adaptive quality** — geometry detail, particle count, DPR, and effect chain
  scale to the device (mobile → low/mid, desktop → high).
- **Accessible & resilient** — `prefers-reduced-motion` honoured, WebGL
  fallback, semantic content that reads without JS.

## Architecture

```
src/
├── main.js              # boot: capability check → preloader → world → scroll
├── style.css            # design tokens, fluid type (phone → 4K), gothic UI
├── scene/
│   ├── World.js         # renderer, camera, loop, quality tier, scroll keyframes
│   ├── Relic.js         # hero monolith + shader material
│   ├── Ash.js           # GPU ember particle field
│   ├── Environment.js   # gradient void dome + halo + fog
│   └── Post.js          # merged post-processing chain
├── shaders/             # GLSL as JS strings (noise, relic, ash)
├── scroll/Scroll.js     # Lenis + ScrollTrigger choreography
└── ui/                  # Preloader, Cursor, Sound (synth drone)
```

## Deploy

The build is fully static with a relative base path — drop `dist/` on any host.

- **Vercel / Netlify:** framework = Vite, build `npm run build`, output `dist`.
- **GitHub Pages:** `npm run build`, publish `dist/` (base is already `./`).

---

*ÆTERNVM · MEMENTO · MORI*
