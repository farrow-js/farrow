import { resolve } from 'path'
import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    outDir: './dist/client',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nest: resolve(__dirname, 'nest/index.html'),
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^farrow-api-client$/,
        replacement: resolve(__dirname, '../../packages/farrow-api-client/src'),
      },
      {
        find: /^farrow-api-client\/(.*)/,
        replacement: resolve(__dirname, '../../packages/farrow-api-client/src/$1'),
      },
      {
        find: /^farrow-pipeline$/,
        replacement: resolve(__dirname, '../../packages/farrow-pipeline/src'),
      },
      {
        find: /^farrow-pipeline\/(.*)/,
        replacement: resolve(__dirname, '../../packages/farrow-pipeline/src/$1'),
      },
    ],
  },
})
