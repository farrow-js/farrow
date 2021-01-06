const { createServerBundler } = require('farrow-dev')
const pkg = require('./package.json')

const bundler = createServerBundler({
  entry: 'index.tsx',
  dist: 'dist',
  external: [...Object.keys(pkg.dependencies)],
})

bundler.start()
