import type { SetOption as CookieOptions } from 'cookies'
import type { IncomingMessage, ServerResponse } from 'http'
import type Stream from 'stream'
import mime from 'mime-types'
import typeis from 'type-is'
import contentDisposition, { Options as ContentDispositionOptions } from 'content-disposition'

import type { RequestInfo } from './requestInfo'
import type { JsonType } from 'farrow-schema'

export type Value = string | number

export type Values = {
  [key: string]: Value
}

export type Status = {
  code: number
  message?: string
}

export type Headers = {
  [key: string]: Value
}

export type Cookies = {
  [key: string]: {
    value: Value | null
    options?: CookieOptions
  }
}

export type SharedResponseInfo = {
  status?: Status
  headers?: Headers
  cookies?: Cookies
}

export type EmptyBody = {
  type: 'empty'
  value: null
}

export type StringBody = {
  type: 'string'
  value: string
}

export type JsonBody = {
  type: 'json'
  value: JsonType
}

export type StreamBody = {
  type: 'stream'
  value: Stream
}

export type BufferBody = {
  type: 'buffer'
  value: Buffer
}

export type RedirectBody = {
  type: 'redirect'
  usePrefix: boolean
  value: string
}

export type FileBodyOptions = {
  flags?: string
  encoding?: BufferEncoding
  fd?: number
  mode?: number
  autoClose?: boolean
  emitClose?: boolean
  start?: number
  end?: number
  highWaterMark?: number
}

export type FileBody = {
  type: 'file'
  value: string
  options?: FileBodyOptions
}

export type CustomBodyHandler = (arg: {
  req: IncomingMessage
  res: ServerResponse
  requestInfo: RequestInfo
  responseInfo: Omit<ResponseInfo, 'body'>
}) => any

export type CustomBody = {
  type: 'custom'
  handler: CustomBodyHandler
}

export type Body = EmptyBody | StringBody | JsonBody | StreamBody | BufferBody | FileBody | CustomBody | RedirectBody

export type BodyMap = {
  [V in Body as V['type']]: V
}

export type ResponseInfo = {
  status?: Status
  headers?: Headers
  cookies?: Cookies
  body?: Body
  vary?: string[]
}

export const empty = (): ResponseInfo => {
  return {
    body: {
      type: 'empty',
      value: null,
    },
  }
}

export const string = (value: string): ResponseInfo => {
  return {
    body: {
      type: 'string',
      value,
    },
  }
}

export type RedirectOptions = {
  usePrefix?: boolean
}

export const redirect = (url: string, options?: RedirectOptions): ResponseInfo => {
  return {
    body: {
      type: 'redirect',
      value: url,
      usePrefix: options?.usePrefix ?? true,
    },
  }
}

export const custom = (handler: CustomBodyHandler = () => undefined): ResponseInfo => {
  return {
    body: {
      type: 'custom',
      handler,
    },
  }
}

export const stream = (stream: Stream): ResponseInfo => {
  return {
    body: {
      type: 'stream',
      value: stream,
    },
  }
}

export const buffer = (buffer: Buffer): ResponseInfo => {
  return {
    body: {
      type: 'buffer',
      value: buffer,
    },
  }
}

export const file = (filename: string, options?: FileBodyOptions): ResponseInfo => {
  return {
    body: {
      type: 'file',
      value: filename,
      options,
    },
  }
}

export const attachment = (filename?: string, options?: ContentDispositionOptions): ResponseInfo => {
  return headers({
    'Content-Disposition': contentDisposition(filename, options),
  })
}

export const status = (code: number, message: string = ''): ResponseInfo => {
  return {
    status: {
      code,
      message,
    },
  }
}

export const headers = (headers: Headers): ResponseInfo => {
  return {
    headers,
  }
}

export const header = (name: string, value: Value): ResponseInfo => {
  return headers({ [name]: value })
}

export const cookies = (config: { [key: string]: Value | null }, options?: CookieOptions): ResponseInfo => {
  const cookies = {} as Cookies

  Object.entries(config).forEach(([name, value]) => {
    cookies[name] = {
      value,
      options,
    }
  })

  return {
    cookies,
  }
}

export const cookie = (name: string, value: Value | null, options?: CookieOptions): ResponseInfo => {
  return cookies({ [name]: value }, options)
}

export const vary = (...fileds: string[]): ResponseInfo => {
  return {
    vary: fileds,
  }
}

export const merge = (...responses: ResponseInfo[]) => {
  const result = {} as ResponseInfo

  responses.forEach((response) => {
    if (response.body) {
      result.body = response.body
    }

    if (response.status) {
      result.status = Object.assign({}, result.status, response.status)
    }

    if (response.headers) {
      result.headers = Object.assign({}, result.headers, response.headers)
    }

    if (response.cookies) {
      result.cookies = Object.assign({}, result.cookies, response.cookies)
    }

    if (response.vary) {
      result.vary = [...(result.vary ?? []), ...response.vary]
    }
  })

  return result
}

export const type = (type: string): ResponseInfo => {
  const contentType = mime.contentType(type)

  if (contentType === false) {
    return headers({})
  }

  return headers({
    'Content-Type': contentType,
  })
}

export const is = (info: ResponseInfo, ...types: string[]) => {
  const contentType = info.headers?.['content-type'] ?? info.headers?.['Content-Type']

  if (!contentType) {
    return false
  }

  return typeis.is(contentType.toString(), types)
}

export const text = (value: string): ResponseInfo => {
  return merge(type('text'), string(value))
}

export const html = (value: string): ResponseInfo => {
  return merge(type('html'), string(value))
}

export const json = (value: JsonType): ResponseInfo => {
  return merge(type('json'), {
    body: {
      type: 'json',
      value,
    },
  })
}
