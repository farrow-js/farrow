const { createFarrowConfig } = require('farrow')

module.exports = createFarrowConfig({
  server: {
    src: './src',
    dist: './dist',
  },
  api: [
    {
      src: 'http://localhost:3002/api/todo',
      // useful for testing api
      dist: `${__dirname}/client/todo.ts`,
    },
  ],
})
