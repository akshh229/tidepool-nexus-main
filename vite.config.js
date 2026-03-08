import { defineConfig } from 'vite';
export default defineConfig({
  optimizeDeps: { include: ['three', 'three-stdlib'] },
  build: { target: 'esnext' }
});
