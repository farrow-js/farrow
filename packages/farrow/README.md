# farrow

Useful modules for developing farrow app

## Setup

Install via npm or yarn

```shell
# via npm
npm install --save farrow

# via yarn
yarn add farrow
```

add `scripts` to your `package.json`

```json
{
  "scripts": {
    "dev": "farrow dev",
    "build": "farrow build",
    "start": "farrow start"
  }
}
```

and then:

- `npm run dev` for developing
- `npm run build` for bundling the source code
- `npm run start` for runing the output code of bundler

`farrow` assumes that your source code is in `src` folder, and the output code is in `dist` folder.

## farrow.config.js

`farrow.config.js` is used to configure the behaviour of `farrow`

### Example

```javascript
// farrow.config.js
const { createFarrowConfig } = require('farrow')

module.exports = createFarrowConfig({
  server: {
    entry: 'index.js',
    src: 'src',
    dist: 'dist',
    // uncomment next-line to debug
    // nodeArgs: ['--inspect-brk']
  },
  // for connecting farrow-api-server and codegen farrow-api-client
  // api: [
  //   {
  //     src: 'http://localhost:3002/api/todo',
  //     dist: `${__dirname}/src/api/todo.ts`,
  //   },
  // ],
})
```

### Type

```typescript
export type Config = {
  server?: ServerBundlerOptions | ServerBundlerOptions[] | false
  api?: ApiClientOptions | ApiClientOptions[] | false
}

export type ServerBundlerOptions = {
  /**
   * filename of entry
   */
  entry?: string
  /**
   * folder of source code
   */
  src?: string
  /**
   * folder of output code
   */
  dist?: string
  /**
   * - args for node.js
   * - eg. ['--inspect-brk'] for debugging
   */
  nodeArgs?: string[]
  /**
   * - env for node.js
   * - eg. { NODE_ENV: 'production' }
   * - NODE_ENV = production in `farrow start`
   * - NODE_ENV = development in `farrow dev`
   */
  env?: NodeJS.ProcessEnv
  /**
   * other options for esbuild
   */
  esbuild?: Omit<BuildOptions, 'entryPoints' | 'outdir' | 'outbase'>
  /**
   * auto add closest package.json dependenties to esbuild external or not
   */
  autoExternal?: boolean
}

export type ApiClientOptions = {
  /**
   * http address of farrow-api
   */
  src: string
  /**
   * file address of codegen target
   */
  dist: string
  /**
   * codegen options
   */
  codegen?: CodegenOptions
  /**
   * the interval of polling
   * default value is 3000ms
   */
  pollingInterval?: number
  /**
   * logger options for polling
   */
  logger?: false | ((options: ApiClientOptions) => void)
  /**
   * transform source code received from server
   * it's useful when need to attach custom code snippet
   */
  transform?: (source: string) => string
  /**
   * format source code via codegen
   */
  format?: (source: string) => string
}

export type CodegenOptions = {
  /**
   * emit createApiClient or not
   * if set to false, just types will be codegened
   */
  emitApiClient?: boolean
}
```
