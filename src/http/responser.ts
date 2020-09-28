import { createResponser } from './index'
import * as Schema from '../core/schema'

import statuses from 'statuses'

export const json = Schema.json

export const JsonResponser = createResponser(json, (params) => {
  let { data, res } = params

  let content = JSON.stringify(data)
  let contentLength = Buffer.byteLength(content)

  res.statusCode = 200
  res.statusMessage = statuses.message[200] ?? ''

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Length', contentLength)

  res.end(content)
})

export const text = Schema.createType({
  toJSON: () => {
    return {
      type: 'Text',
    }
  },
  validate: (input) => {
    return Schema.string.validate(input)
  },
})

export const TextResponser = createResponser(text, (params) => {
  let { data, res } = params

  let content = data
  let contentLength = Buffer.byteLength(content)

  res.statusCode = 200
  res.statusMessage = statuses.message[200] ?? ''

  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Content-Length', contentLength)

  res.end(content)
})

export const html = Schema.createType({
  toJSON: () => {
    return {
      type: 'HTML',
    }
  },
  validate: (input) => {
    return Schema.string.validate(input)
  },
})

export const HTMLResponser = createResponser(html, (params) => {
  let { data, res } = params

  let content = data
  let contentLength = Buffer.byteLength(content)

  res.statusCode = 200
  res.statusMessage = statuses.message[200] ?? ''

  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Content-Length', contentLength)

  res.end(content)
})

export const status = Schema.object({
  code: Schema.number,
  message: Schema.nullable(Schema.string),
})

export const StatusResponser = createResponser(status, (params) => {
  let { data, res } = params
  let { code, message } = data

  res.statusCode = data.code
  res.statusMessage = message || (statuses.message[code] ?? '')
  res.end()
})
