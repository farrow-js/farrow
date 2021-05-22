import chalk from 'chalk'
import util from 'util'
import bytes from 'bytes'
import { prettyTime } from './util'
import type { RequestInfo } from './requestInfo'

const colorCodes = {
  7: 'magenta' as const,
  5: 'red' as const,
  4: 'yellow' as const,
  3: 'cyan' as const,
  2: 'green' as const,
  1: 'green' as const,
  0: 'yellow' as const,
}

const getColor = (str: string, code: number): string => {
  const method = colorCodes[code] ?? 'yellow'
  return chalk[method](str)
}

export type LoggerArgs = {
  requestInfo: RequestInfo
}

export type LoggerOptions = {
  transporter?: (str: string) => void
}

export type LoggerEvent = 'error' | 'close' | 'finish'

export const createLogger = (options?: LoggerOptions) => {
  const config: Required<LoggerOptions> = {
    transporter: (str) => console.log(str),
    ...options,
  }

  const { transporter } = config

  const print = (format: string, ...args: (string | number)[]) => {
    const string = util.format(format, ...args)
    transporter(string)
  }

  const logInput = (method: string, url: string) => {
    print(`  ${chalk.gray('<--')} ${chalk.bold('%s')} ${chalk.gray('%s')}`, method, url)
  }

  const logOutput = (
    method: string,
    url: string,
    status: number,
    startTime: number,
    contentLength: number,
    event: LoggerEvent,
  ) => {
    const colorCode = (status / 100) | 0
    const length = [204, 205, 304].includes(status) ? '' : contentLength ? bytes(contentLength) : '-'
    const upstream = event === 'error' ? chalk.red('xxx') : event === 'close' ? chalk.yellow('-x-') : chalk.gray('-->')

    print(
      `  ${upstream} ${chalk.bold('%s')} ${chalk.gray('%s')} ${getColor('%s', colorCode)} ${chalk.gray(
        '%s',
      )} ${chalk.gray('%s')}`,
      method,
      url,
      status,
      prettyTime(startTime),
      length,
    )
  }

  return {
    print,
    logInput,
    logOutput,
  }
}
