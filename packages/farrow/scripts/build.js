const { argv } = require('yargs')
const build = require('../dist/build').default

build(argv)
