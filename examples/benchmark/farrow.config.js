const { defineConfig } = require('farrow')

module.exports = defineConfig({
  server: [
    {
      src: './src/simple',
      dist: './dist/simple',
    },
    {
      src: './src/schema',
      dist: './dist/schema',
    },
  ],
})
