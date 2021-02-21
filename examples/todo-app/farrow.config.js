const { createFarrowConfig } = require('farrow')
const pkg = require('./package.json')

module.exports = createFarrowConfig({
  server: [
    {
      // nodeArgs: ['--inspect'],
      src: './server',
      dist: './dist/server',
      esbuild: {
        external: [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)],
      },
    },
  ],
  api: [
    {
      src: 'http://localhost:3002/api/todo',
      dist: `${__dirname}/src/api/todo/createApiClient.ts`,
    },
  ],
})
