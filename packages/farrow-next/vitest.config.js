const base = require('../../vitest.config.base')

module.exports = {
  ...base,
  test: {
    ...base.test,
    environment: 'jsdom',
    root: __dirname,
  },
}
