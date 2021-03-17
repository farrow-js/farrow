const { createFarrowConfig } = require('farrow')

module.exports = createFarrowConfig({
  server: {
    src: './server',
    dist: './dist/server',
  },
  api: [
    {
      src: 'http://localhost:3003/api/greet',
      dist: `${__dirname}/src/api/greet.ts`,
    },
  ],
})
