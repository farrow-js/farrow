import { defineConfig } from 'tsdown'

export default defineConfig({
  tsconfig: 'tsconfig.json',
  entry: ['src/**/*.ts', 'src/**/*.tsx'],
  format: ['cjs', 'esm'],
  outDir: 'dist',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  unbundle: true,
  dts: false,
  clean: true,
  sourcemap: true,
})
