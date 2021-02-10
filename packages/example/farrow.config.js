const { createFarrowConfig } = require('farrow')
const pkg = require('./package.json')

module.exports = createFarrowConfig({
  server: {
    // nodeArgs: ['--inspect'],
    esbuild: {
      keepNames: true,
      external: [...Object.keys(pkg.dependencies)],
    },
  },
  api: {
    services: [
      {
        src: 'http://localhost:3002/service/todo',
        dist: `${__dirname}/client/todo.ts`,
      },
    ],
  },
})
