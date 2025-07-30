import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        quiz: resolve(__dirname, 'quiz.html'),
        vocabulary: resolve(__dirname, 'vocabulary.html'),
        profile: resolve(__dirname, 'profile.html'),
      }
    }
  }
});
