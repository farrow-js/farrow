const base = require('../../vitest.config.base')

module.exports = {
  ...base,
  test: {
    ...base.test,
    root: __dirname,
  },
}
