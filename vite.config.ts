import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        game: fileURLToPath(new URL('./index.html', import.meta.url)),
        wireframes: fileURLToPath(new URL('./outputs/wireframes/index.html', import.meta.url)),
      },
    },
  },
});
