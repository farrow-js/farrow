import { defineConfig } from 'tsdown'

export default defineConfig({
  tsconfig: 'tsconfig.esm.json',
  entry: {
    index: 'src/index.ts',
    'bin/index': 'src/bin/index.ts',
    'scripts/dev': 'src/scripts/dev.ts',
    'scripts/start': 'src/scripts/start.ts',
    'scripts/build': 'src/scripts/build.ts',
  },
  format: ['cjs', 'esm'],
  outDir: 'dist',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  unbundle: false,
  dts: false,
  clean: true,
  sourcemap: true,
})
