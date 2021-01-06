#!/usr/bin/env node

let querystring = require('query-string')
// eslint-disable-next-line prefer-destructuring
let command = process.argv[2]
let [script, params = ''] = command.split('?')
let query = querystring.parse(params)
params = Object.keys(query).map((key) => (query[key] ? `--${key}=${query[key]}` : `--${key}`))
let Farrow = require('../dist')
let result

switch (script) {
  case 'start':
    return Farrow.start()
  case 'build':
    return Farrow.build()
  default:
    console.log(`Unknown script "${script}".`)
    break
}

if (result) {
  switch (result.signal) {
    case 'SIGKILL':
      console.log(
        'The build failed because the process exited too early. ' +
          'This probably means the system ran out of memory or someone called ' +
          '`kill -9` on the process.',
      )
      process.exit(1)
      break
    case 'SIGTERM':
      console.log(
        'The build failed because the process exited too early. ' +
          'Someone might have called `kill` or `killall`, or the system could ' +
          'be shutting down.',
      )
      process.exit(1)
      break
    default: {
      throw new Error(`Unknown signal: ${result.signal}`)
    }
  }
}
