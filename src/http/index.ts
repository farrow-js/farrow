import { createServer, IncomingMessage, ServerResponse } from 'http'
import parseBody, { Options as BodyOptions } from 'co-body'
import { parse as parseCookies, CookieParseOptions as CookieOptions } from 'cookie'
import { parse as parseQuery, IParseOptions as QueryOptions } from 'qs'
import typeis from 'type-is'

import { createPipeline, PipelineOptions } from '../core/pipeline'
import * as Schema from '../core/schema'

const jsonTypes = ['json', 'application/*+json', 'application/csp-report']
const formTypes = ['urlencoded']
const textTypes = ['text']

const getBody = async (req: IncomingMessage, options?: BodyOptions) => {
  let type = typeis(req, jsonTypes) || typeis(req, formTypes) || typeis(req, textTypes)

  if (type) {
    let body = await parseBody(req, options)
    return body
  }

  return null
}

export type RequestInfo = {
  pathname: string
  method?: string
  query?: Record<string, any>
  body?: any
  headers?: Record<string, any>
  cookies?: Record<string, any>
}

export type Response = Schema.Term

export type RequestHandlerParams<T = any> = {
  data: T
  req: IncomingMessage
  res: ServerResponse
  info: RequestInfo
}

export type RequestHandler<T> = (params: RequestHandlerParams<T>) => any

export type Responser<T = any> = {
  Type: Schema.Type<T>
  handler: RequestHandler<T>
}

export const createResponser = <T>(
  Type: Schema.Type<T>,
  handler: RequestHandler<T>
): Responser<T> => {
  return {
    Type,
    handler,
  }
}

export interface HttpPipelineOptions<T> extends PipelineOptions<T> {
  responsers?: Responser[]
  body?: BodyOptions
  cookie?: CookieOptions
  query?: QueryOptions
}

export const createHttpPipeline = (options: HttpPipelineOptions<any>) => {
  type Output = Schema.Term | Promise<Schema.Term>

  let pipeline = createPipeline<RequestInfo, Output>({
    defaultOutput: options.defaultOutput,
    contexts: options.contexts,
  })

  let { responsers = [] } = options

  let handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    let url = req.url

    if (typeof url !== 'string') {
      throw new Error(`req.url is not existed`)
    }

    let [pathname = '/', search = ''] = url.split('?')

    let method = req.method ?? 'GET'

    let query = parseQuery(search, options.query) as RequestInfo['query']

    let body = await getBody(req, options.body)

    let headers = req.headers as RequestInfo['headers']

    let cookies = parseCookies(req.headers['cookie'] ?? '', options.cookie)

    let requestInfo: RequestInfo = {
      pathname,
      method,
      query,
      body,
      headers,
      cookies,
    }

    let term = await pipeline.run(requestInfo)

    let matched = false

    for (let i = 0; i < responsers.length; i++) {
      let responser = responsers[i]

      if (responser.Type.is(term)) {
        let params: RequestHandlerParams = {
          data: term.value,
          req,
          res,
          info: requestInfo,
        }

        matched = true

        await responser.handler(params)
        break
      }
    }

    if (!matched) {
      throw new Error(`None of responsers can handle the response: ${term.value}`)
    }
  }

  let handle = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      return await handleRequest(req, res)
    } catch (error) {
      res.statusCode = 500
      res.statusMessage = error.message || ''
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Content-Length', Buffer.byteLength(res.statusMessage))
      res.end(res.statusMessage)
    }
  }

  let add = pipeline.add

  let run = pipeline.run

  let listen = (port: number, callback: () => void) => {
    let server = createServer(handle)
    server.listen(port, callback)
    return server
  }

  return {
    add,
    run,
    handle,
    listen,
  }
}
