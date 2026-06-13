import { defineConfig } from 'vite';

// Static deploy-friendly config. Relative base so it works on GitHub Pages
// project sites, Vercel, Netlify, or a plain file host without rewrites.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
