import { defineConfig } from 'tsdown'

export default defineConfig({
  tsconfig: 'tsconfig.json',
  entry: {
    index: 'src/index.ts',
    http: 'src/http.ts',
    https: 'src/https.ts',
    router: 'src/router.ts',
    requestInfo: 'src/requestInfo.ts',
    responseInfo: 'src/responseInfo.ts',
    response: 'src/response.ts',
    logger: 'src/logger.ts',
    basenames: 'src/basenames.ts',
    HttpError: 'src/HttpError.ts',
    context: 'src/context.ts',
    util: 'src/util.ts',
    types: 'src/types.ts'
  },
  format: ['cjs', 'esm'],
  outDir: 'dist',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  unbundle: true,
  dts: false,
  clean: true,
  sourcemap: true,
})
