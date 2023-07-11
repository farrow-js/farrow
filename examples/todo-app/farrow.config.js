const { createFarrowConfig } = require('farrow')

module.exports = createFarrowConfig({
  server: {
    src: './server',
    dist: './dist/server',
  },
  api: [
    {
      src: 'http://localhost:3002/api/example',
      dist: `${__dirname}/src/__generated__/example.ts`,
    },
  ],
})
