import { Command } from 'commander'
import chalk from 'chalk'
import leven from 'leven'

import dev from '../scripts/dev'
import build from '../scripts/build'
import start from '../scripts/start'

import type { GetConfigOptions } from '../config'

process.on('unhandledRejection', (err) => {
  throw err
})

const pkg = require('../../package.json')
const program = new Command()

program.version(pkg.version).name(pkg.name)

program
  .command('dev')
  .description(`start development mode at ${process.cwd()}`)
  .option('-c, --config <config>', 'config file path')
  .action((options: GetConfigOptions) => {
    return dev(options)
  })

program
  .command('build')
  .description(`bundle project at ${process.cwd()}`)
  .option('-c, --config <config>', 'config file path')
  .action((options: GetConfigOptions) => {
    return build(options)
  })

program
  .command('start')
  .description(`start production mode at ${process.cwd()}`)
  .option('-c, --config <config>', 'config file path')
  .action((options: GetConfigOptions) => {
    return start(options)
  })

// output help information on unknown COMMANDS
program.arguments('<command>').action((cmd) => {
  program.outputHelp()
  console.log(`  ${chalk.red(`Unknown command ${chalk.yellow(cmd)}.`)}`)
  console.log()
  suggestCommands(cmd)
})

program.on('--help', () => {
  console.log('')
  console.log('Example call:')
  console.log(`  $ ${pkg.name} --help`)
})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

function suggestCommands(unknownCommand: string) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const availableCommands = program.commands.map((cmd) => cmd._name)

  let suggestion: string | undefined = undefined

  availableCommands.forEach((cmd) => {
    const isBestMatch = leven(cmd, unknownCommand) < leven(suggestion || '', unknownCommand)
    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd
    }
  })

  if (suggestion) {
    console.log(`  ${chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`)}`)
  }
}
