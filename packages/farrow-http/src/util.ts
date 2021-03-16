import fs from 'fs'
import typeis from 'type-is'
import parseBody, { Options as BodyOptions } from 'co-body'

import type { IncomingMessage, ServerResponse } from 'http'

export type PrettyNumberOptions = {
  delimiter?: string
  separator?: string
}

export const defaultPrettyNumberOptions: Required<PrettyNumberOptions> = {
  delimiter: ',',
  separator: '.',
}

export const prettyNumber = function (number: number | string, options?: PrettyNumberOptions) {
  let config = {
    ...defaultPrettyNumberOptions,
    ...options,
  }
  let { delimiter, separator } = config
  let [first, ...rest] = number.toString().split('.')
  let text = first.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${delimiter}`)

  return [text, ...rest].join(separator)
}

export const prettyTime = (start: number): string => {
  let delta = Date.now() - start
  return prettyNumber(delta < 10000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`)
}

export const { access } = fs.promises

export const { stat } = fs.promises

export const getStats = (filename: string) => {
  return stat(filename)
    .then((stats) => stats)
    .catch(() => undefined)
}

export const getContentLength = (res: ServerResponse) => {
  let contentLength = res.getHeader('Content-Length')
  if (typeof contentLength === 'string') {
    let length = parseFloat(contentLength)
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

export const getBody = async (req: IncomingMessage, options?: BodyOptions) => {
  let type = typeis(req, jsonTypes) || typeis(req, formTypes) || typeis(req, textTypes)

  if (type) {
    let body = await parseBody(req, options)
    return body
  }

  return null
}
