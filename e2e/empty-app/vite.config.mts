import { defineConfig } from 'vite'

export default defineConfig({
  root: 'e2e/empty-app',
  build: {
    outDir: 'build',
  },
  preview: {
    host: '127.0.0.1',
    port: 8080,
    headers: {
      // these headers are required for BroadcastChannel to work
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
