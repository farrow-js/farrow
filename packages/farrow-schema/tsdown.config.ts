import { defineConfig } from 'tsdown'

export default defineConfig({
  tsconfig: 'tsconfig.esm.json',
  entry: {
    index: 'src/index.ts',
    schema: 'src/schema.ts',
    types: 'src/types.ts',
    result: 'src/result.ts',
    helper: 'src/helper.ts',
    formatter: 'src/formatter.ts',
    utils: 'src/utils.ts',
    validator: 'src/validator.ts'
  },
  format: ['cjs', 'esm'],
  outDir: 'dist',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  unbundle: true,
  dts: false,
  clean: true,
  sourcemap: true,
})
