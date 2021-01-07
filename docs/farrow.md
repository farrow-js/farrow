# farrow

Useful modules for developing farrow app

## Setup

Install via npm or yarn

```shell
npm install --save farrow
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

Example

```javascript
// farrow.config.js
const { createFarrowConfig } = require('farrow')
const pkg = require('./package.json')

module.exports = createFarrowConfig({
  server: {
    entry: 'index.js',
    src: 'src',
    dist: 'dist',
    // uncomment next-line to debug
    // nodeArgs: ['--inspect-brk'],
    esbuild: {
      external: [...Object.keys(pkg.dependencies)],
    },
  },
})
```

Type

```typescript
export type ServerBundlerOptions = {
  // filename of entry
  entry?: string
  // folder of source code
  src?: string
  // folder of output code
  dist?: string
  // args for node.js
  // eg. ['--inspect-brk'] for debugging
  nodeArgs?: string[]
  // env for node.js
  // eg. { NODE_ENV: 'production' }
  // NODE_ENV = production in `farrow start`
  // NODE_ENV = development in `farrow dev`
  env?: NodeJS.ProcessEnv
  // other options for esbuild
  esbuild?: Omit<BuildOptions, 'entryPoints' | 'outdir' | 'outbase'>
}
```
