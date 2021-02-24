const { createFarrowConfig } = require('farrow')
const pkg = require('./package.json')

module.exports = createFarrowConfig({
  server: [
    {
      // nodeArgs: ['--inspect'],
      esbuild: {
        external: [...Object.keys(pkg.dependencies)],
      },
    },
  ],
  api: [
    {
      src: 'http://localhost:3002/service/todo',
      dist: `${__dirname}/client/todo.ts`,
    },
    {
      src: 'http://localhost:3002/service/pet-store',
      dist: `${__dirname}/client/pet-store.ts`,
    },
  ],
})
