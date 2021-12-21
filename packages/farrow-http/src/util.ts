import fs from 'fs'
import typeis from 'type-is'
import parseBody, { Options as BodyOptions } from 'co-body'

import type { IncomingMessage, ServerResponse } from 'http'
import type { MaybeAsync } from 'farrow-pipeline'

export type PrettyNumberOptions = {
  delimiter?: string
  separator?: string
}

export const defaultPrettyNumberOptions: Required<PrettyNumberOptions> = {
  delimiter: ',',
  separator: '.',
}

export const prettyNumber = function (number: number | string, options?: PrettyNumberOptions) {
  const config = {
    ...defaultPrettyNumberOptions,
    ...options,
  }
  const { delimiter, separator } = config
  const [first, ...rest] = number.toString().split('.')
  const text = first.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${delimiter}`)

  return [text, ...rest].join(separator)
}

export const prettyTime = (start: number): string => {
  const delta = Date.now() - start
  return prettyNumber(delta < 10000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`)
}

export const { access, stat } = fs.promises

export const getStats = (filename: string) => {
  return stat(filename)
    .then((stats) => stats)
    .catch(() => undefined)
}

export const getContentLength = (res: ServerResponse) => {
  const contentLength = res.getHeader('Content-Length')
  if (typeof contentLength === 'string') {
    const length = parseFloat(contentLength)
    return isNaN(length) ? 0 : length
  }
  if (typeof contentLength !== 'number') {
    return 0
  }
  return contentLength
}

const jsonTypes = ['json', 'application/*+json', 'application/csp-report']
const formTypes = ['urlencoded']
const textTypes = ['text']

export const getBody = (req: IncomingMessage, options?: BodyOptions) => {
  const type = typeis(req, jsonTypes) || typeis(req, formTypes) || typeis(req, textTypes)

  if (type) {
    return parseBody(req, options)
  }

  return null
}

export const isPromise = <Input>(input: MaybeAsync<Input>): input is Promise<Input> => {
  return input && 'then' in input && typeof input.then === 'function'
}
