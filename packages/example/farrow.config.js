const { createFarrowConfig } = require('farrow')
const pkg = require('./package.json')

module.exports = createFarrowConfig({
  server: {
    external: [...Object.keys(pkg.dependencies)],
  },
})
