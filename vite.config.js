import { defineConfig } from 'vite';

// The static build is hosted below /webgame/play-sanguo/; relative URLs keep
// local preview, GitHub Pages-style mirrors and the production subdirectory portable.
export default defineConfig({
  base: './',
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) return 'three-vendor';
          if (id.includes('/node_modules/planck/')) return 'physics-vendor';
        },
      },
    },
  },
});
