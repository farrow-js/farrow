import { defineConfig } from 'tsdown'

export default defineConfig({
  tsconfig: 'tsconfig.esm.json',
  entry: {
    index: 'src/index.ts',
    api: 'src/api.ts',
    codegen: 'src/codegen.ts',
    controvert: 'src/controvert.ts',
    toJSON: 'src/toJSON.ts'
  },
  format: ['cjs', 'esm'],
  outDir: 'dist',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  unbundle: true,
  dts: false,
  clean: true,
  sourcemap: true,
})
