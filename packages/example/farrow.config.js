const { createFarrowConfig } = require('farrow')
const pkg = require('./package.json')

module.exports = createFarrowConfig({
  server: {
    esbuild: {
      external: [...Object.keys(pkg.dependencies)],
    },
  },
})
