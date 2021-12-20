const { defineConfig } = require('farrow')

module.exports = defineConfig({
  server: [
    {
      src: './src/schema',
      dist: './dist/schema',
    },
  ]
})
