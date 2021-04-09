const { createFarrowConfig } = require('farrow')

module.exports = createFarrowConfig({
  server: [
    {
      // nodeArgs: ['--inspect'],
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
