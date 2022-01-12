#!/usr/bin/env node

'use strict'

const currentNodeVersion = process.versions.node
const semver = currentNodeVersion.split('.')
const major = semver[0]

if (major < 14) {
  console.error(
    `You are running Node ${currentNodeVersion}.\n` +
      `Farrow requires Node 14 or higher. \n` +
      `Please update your version of Node.`,
  )
  process.exit(1)
}

require('../dist/bin/index.js')
