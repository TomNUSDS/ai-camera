import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import { mediapipe } from 'vite-plugin-mediapipe';

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {
    outDir: "./dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  plugins: [
    react(),
    mediapipe({'face_detection.js': ['FaceDetection', 'VERSION'],}),
    viteStaticCopy({
      targets: [
        {
          src: './node_modules/@mediapipe/face_detection/*',
          dest: 'mediapipe'
        }
      ]
    })
  ],
})
