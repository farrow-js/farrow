import { createServer, IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import * as path from 'path'

import parseBody, { Options as BodyOptions } from 'co-body'
import { parse as parseCookies, CookieParseOptions as CookieOptions } from 'cookie'
import { parse as parseQuery, IParseOptions as QueryOptions } from 'qs'
import typeis from 'type-is'
import CookiesClass from 'cookies'
import statuses from 'statuses'
import accepts from 'accepts'
import encodeurl from 'encodeurl'
import escapeHtml from 'escape-html'
import vary from 'vary'
import onfinish from 'on-finished'
import destroy from 'destroy'
import mime from 'mime-types'

import {
  createCell,
  createContext,
  runWithContext,
  createPipeline,
  Middleware,
  PipelineOptions,
  useCell,
  Context,
} from '../core/pipeline'

import { MaybeAsyncResponse, Response } from './response'

import { ResponseInfo, Status, Headers, Cookies, RedirectBody } from './responseInfo'

import { BasenameCell, useBasename } from './basename'

import { route as createRoute, RoutenameCell, useRoutename } from './routename'

import { Json } from '../core/types'
import { Stream } from 'stream'
import { DirnameCell } from './dirname'

export { Response, ResponseInfo }

export { useRoutename, useBasename }

const RequestCell = createCell<IncomingMessage | null>(null)

export const useRequest = () => {
  let request = useCell(RequestCell)

  if (request.value === null) {
    throw new Error(`Expected Request, but found null`)
  }

  return request.value
}

const ResponseCell = createCell<ServerResponse | null>(null)

export const useResponse = () => {
  let response = useCell(ResponseCell)

  if (response.value === null) {
    throw new Error(`Expected Response, but found null`)
  }

  return response.value
}

export const useReq = useRequest
export const useRes = useResponse

export type RequestInfo = {
  pathname: string
  method?: string
  query?: Record<string, any>
  body?: any
  headers?: Record<string, any>
  cookies?: Record<string, any>
}

export type ResponseOutput = MaybeAsyncResponse

export interface HttpPipelineOptions extends PipelineOptions {
  body?: BodyOptions
  cookie?: CookieOptions
  query?: QueryOptions
}

export type HttpMiddleware = Middleware<RequestInfo, ResponseOutput>

export const createHttpPipeline = (options: HttpPipelineOptions) => {
  let pipeline = createPipeline<RequestInfo, ResponseOutput>()

  let handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    if (typeof req.url !== 'string') {
      throw new Error(`req.url is not existed`)
    }

    let url = req.url

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

    let context = createContext({
      ...options.contexts,
      request: RequestCell.create(req),
      response: ResponseCell.create(res),
      basename: BasenameCell.create(''),
      routename: RoutenameCell.create(''),
    })

    let responser = await pipeline.run(requestInfo, {
      context,
      onLast: () => Response.status(404).text('404 Not Found'),
    })

    return handleResponse({
      req,
      res,
      requestInfo,
      responseInfo: responser.info,
      context,
    })
  }

  let handle = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      return await handleRequest(req, res)
    } catch (error) {
      let message =
        process.env.NODE_ENV !== 'production' ? error?.stack || error?.message : error?.message

      if (!res.headersSent) {
        res.statusCode = 500
        res.statusMessage = message
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Length', Buffer.byteLength(res.statusMessage))
      }

      if (!res.writableEnded) {
        res.end(message)
      }
    }
  }

  let add = pipeline.add

  let run = pipeline.run

  let listen = (port: number, callback?: Function) => {
    let server = createServer(handle)
    server.listen(port, callback)
    return server
  }

  let route = (name: string, middleware: HttpMiddleware) => {
    add(createRoute(name, middleware))
  }

  return {
    add,
    route,
    run,
    handle,
    listen,
  }
}

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

export type ResponseParams = {
  requestInfo: RequestInfo
  responseInfo: ResponseInfo
  req: IncomingMessage
  res: ServerResponse
  context: Context
}

export const handleResponse = async (params: ResponseParams) => {
  let { req, res, requestInfo, responseInfo, context } = params
  let basename = context.read(BasenameCell)
  let dirname = context.read(DirnameCell)
  let routename = context.read(RoutenameCell)
  let accept = accepts(req)

  // handle response status
  let handleStatus = (status: Status = { code: 200 }) => {
    let { code, message } = status

    res.statusCode = code
    res.statusMessage = message || (statuses.message[code] ?? '')
  }

  // handle response headers
  let handleHeaders = (headers: Headers) => {
    Object.entries(headers).forEach(([name, value]) => {
      res.setHeader(name, value)
    })
  }

  // handle response cookies
  let handleCookies = (cookies: Cookies) => {
    let cookiesInstance = new CookiesClass(req, res)

    Object.entries(cookies).forEach(([name, cookie]) => {
      if (cookie.value !== null) {
        cookiesInstance.set(name, cookie.value + '', cookie.options)
      } else {
        cookiesInstance.set(name, cookie.options)
      }
    })
  }

  let handleEmpty = () => {
    let code = responseInfo.status?.code ?? 204

    code = statuses.empty[code] ? code : 204

    let body = code + ''

    handleStatus({ code })

    res.removeHeader('Transfer-Encoding')

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Length', Buffer.byteLength(body))

    res.end(body)
  }

  let handleJson = (json: Json) => {
    let content = JSON.stringify(json)
    let length = Buffer.byteLength(content)

    if (res.getHeader('Content-Type') === undefined) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
    }

    res.setHeader('Content-Length', length)
    res.end(content)
  }

  let handleText = (text: string) => {
    let length = Buffer.byteLength(text)

    if (res.getHeader('Content-Type') === undefined) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    }

    res.setHeader('Content-Length', length)
    res.end(text)
  }

  let handleHtml = (html: string) => {
    let length = Buffer.byteLength(html)

    if (res.getHeader('Content-Type') === undefined) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
    }

    res.setHeader('Content-Length', length)
    res.end(html)
  }

  let handleRedirect = (body: RedirectBody) => {
    let url = body.value
    let { useBasename, useRoutename } = body

    if (url === 'back') {
      let referrer = req.headers['referer'] + '' || '/'
      url = referrer
    }

    // handle routename and basename
    if (!url.startsWith('//') && url.startsWith('/')) {
      if (useRoutename) {
        url = routename + url
      }
      if (useBasename) {
        url = basename + url
      }
    }

    let code = responseInfo.status?.code ?? 302

    handleStatus({
      code: statuses.redirect[code] ? code : 302,
    })

    handleHeaders({
      Location: encodeurl(url),
    })

    if (accept.types('html')) {
      handleHtml(`Redirecting to ${escapeHtml(url)}`)
    } else {
      handleText(`Redirecting to ${url}`)
    }
  }

  let handleBuffer = (buffer: Buffer) => {
    res.setHeader('Content-Length', buffer.length)
    res.end(buffer)
  }

  let handleFile = (name: string) => {
    let filename = path.join(dirname, name)
    let stream = fs.createReadStream(filename)
    let ext = path.extname(name)
    let contentType = mime.contentType(ext)

    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }

    return handleStream(res, stream)
  }

  let { body } = responseInfo

  handleStatus(responseInfo.status)

  if (responseInfo.cookies) {
    handleCookies(responseInfo.cookies)
  }

  if (responseInfo.headers) {
    handleHeaders(responseInfo.headers)
  }

  if (responseInfo.vary) {
    vary(res, responseInfo.vary)
  }

  if (!body || body.type === 'empty') {
    return handleEmpty()
  }

  if (body.type === 'json') {
    return handleJson(body.value)
  }

  if (body.type === 'text') {
    return handleText(body.value)
  }

  if (body.type === 'html') {
    return handleHtml(body.value)
  }

  if (body.type === 'redirect') {
    return handleRedirect(body)
  }

  if (body.type === 'stream') {
    return handleStream(res, body.value)
  }

  if (body.type === 'buffer') {
    return handleBuffer(body.value)
  }

  if (body.type === 'file') {
    return handleFile(body.value)
  }

  if (body.type === 'custom') {
    let handler = body.handler
    let handleResponse = () => {
      return handler({
        req: req,
        res,
        requestInfo,
        responseInfo: omitBody(responseInfo),
        basename,
      })
    }
    return runWithContext(handleResponse, context)
  }

  if (body.type === 'raw') {
    res.end(body.value)
    return
  }

  throw new Error(`Unsupported response body: ${JSON.stringify(body, null, 2)}`)
}

const omitBody = <T extends { body?: any }>(obj: T): Omit<T, 'body'> => {
  let { body, ...rest } = obj
  return rest
}

const handleStream = (res: ServerResponse, stream: Stream) => {
  return new Promise<boolean>((resolve, reject) => {
    stream.once('error', reject)
    stream.pipe(res)
    onfinish(res, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve(true)
      }
      destroy(stream)
    })
  })
}
