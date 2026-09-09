import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  root: local('./pages'),
  base: '/neurosense-ai/',
  publicDir: local('./public'),
  plugins: [react()],
  resolve: { alias: { '@': local('./') } },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: {
    outDir: local('./dist-pages'),
    emptyOutDir: true,
    rollupOptions: { input: { home: local('./pages/index.html'), explore: local('./pages/explore/index.html') } },
  },
});
