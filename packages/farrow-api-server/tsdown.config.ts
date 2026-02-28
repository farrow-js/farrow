import { defineConfig } from 'tsdown'

export default defineConfig({
  tsconfig: 'tsconfig.json',
  entry: {
    index: 'src/index.ts',
    apiService: 'src/apiService.ts',
    apiCalling: 'src/apiCalling.ts'
  },
  format: ['cjs', 'esm'],
  outDir: 'dist',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  unbundle: true,
  dts: false,
  clean: true,
  sourcemap: true,
})
