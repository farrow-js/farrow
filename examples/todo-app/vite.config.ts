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
})
