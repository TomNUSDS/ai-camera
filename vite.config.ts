import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import { mediapipe } from 'vite-plugin-mediapipe';

// https://vitejs.dev/config/
export default defineConfig({
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

// /**
//  * Add exports to mediapipe.
//  * Simplified from the vite-plugin-mediapipe npm repo.
//  */
// function mediapipe(config: Record<string, string[]>): PluginOption {
//   return {
//     name: 'mediapipe',
//     load(id: string) {
//       const fileName = basename(id)
//       if (!(fileName in config)) return null
//
//       let code = fs.readFileSync(id, 'utf-8')
//       for (const name of config[fileName]) {
//         code += `exports.${name} = ${name};`
//       }
//       return { code }
//     },
//   }
// }
