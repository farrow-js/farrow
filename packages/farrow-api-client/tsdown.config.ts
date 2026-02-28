import { defineConfig } from 'tsdown'

export default defineConfig({
  tsconfig: 'tsconfig.esm.json',
  entry: {
    index: 'src/index.ts',
    'farrow-api-client': 'src/farrow-api-client.ts',
  },
  format: ['cjs', 'esm'],
  outDir: 'dist',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  unbundle: true,
  dts: false,
  clean: true,
  sourcemap: true,
})
