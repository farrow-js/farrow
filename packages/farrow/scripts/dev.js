const { argv } = require('yargs')
const dev = require('../dist/dev').default

dev(argv)
