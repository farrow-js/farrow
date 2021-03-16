import { createServer, Server } from 'https'
import { parse as parseCookies } from 'cookie'
import { parse as parseQuery } from 'qs'

import { createContainer } from 'farrow-pipeline'

import { handleResponse } from './http'
import { Router } from './router'
import { Response } from './response'
import { createLogger } from './logger'
import { handleBasenames, BasenamesContext } from './basenames'
import { RequestCookies, RequestHeaders, RequestQuery } from './requestInfo'
import { RequestContext, RequestInfoContext, ResponseContext } from './context'
import { getBody, getContentLength } from './util'

import type { IncomingMessage, ServerResponse } from 'http'
import type { SecureContextOptions, TlsOptions } from 'tls'
import type { HttpPipelineOptions } from './http'
import type { RouterPipeline } from './router'
import type { LoggerEvent, LoggerOptions } from './logger'

export type HttpsOptions = SecureContextOptions & TlsOptions

export type HttpsPipelineOptions = HttpPipelineOptions & {
  tsl?: HttpsOptions
}

export type HttpsPipeline = RouterPipeline & {
  handle: (req: IncomingMessage, res: ServerResponse) => Promise<void>
  listen: (...args: Parameters<Server['listen']>) => Server
  server: () => Server
}

export const createHttpsPipeline = (options?: HttpsPipelineOptions): HttpsPipeline => {
  let isNotProduction = process.env.NODE_ENV !== 'production'
  let config: HttpsPipelineOptions = {
    logger: isNotProduction,
    errorStack: isNotProduction,
    ...options,
  }

  let loggerOptions: LoggerOptions = !config.logger || typeof config.logger === 'boolean' ? {} : config.logger

  let logger = config.logger ? createLogger(loggerOptions) : null

  let router = Router()

  let handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    if (typeof req.url !== 'string') {
      throw new Error(`req.url is not existed`)
    }

    let { url } = req

    let [pathname = '/', search = ''] = url.split('?')

    let method = req.method ?? 'GET'

    let query = (req as any).query ?? (parseQuery(search, config.query) as RequestQuery)

    let body = (req as any).body ?? (await getBody(req, config.body))

    let headers = req.headers as RequestHeaders

    let cookies = parseCookies(req.headers['cookie'] ?? '', config.cookie) as RequestCookies

    let { basename, requestInfo } = handleBasenames(config.basenames ?? [], {
      pathname,
      method,
      query,
      body,
      headers,
      cookies,
    })

    let storages = await config.contexts?.({
      req,
      requestInfo,
      basename,
    })

    let container = createContainer({
      ...storages,
      request: RequestContext.create(req),
      response: ResponseContext.create(res),
      basenames: BasenamesContext.create([basename]),
      requestInfo: RequestInfoContext.create(requestInfo),
    })

    let responser = await router.run(requestInfo, {
      container,
      onLast: () => Response.status(404).text('404 Not Found'),
    })

    await handleResponse({
      req,
      res,
      requestInfo,
      responseInfo: responser.info,
      container,
    })
  }

  let handle: HttpsPipeline['handle'] = async (req, res) => {
    if (logger) {
      let startTime = Date.now()
      let method = req.method ?? 'GET'
      let url = req.url ?? ''

      let contentLength = 0

      let hasLogOut = false
      let logOutput = (event: LoggerEvent) => {
        if (hasLogOut) return
        hasLogOut = true
        logger?.logOutput(method, url, res.statusCode, startTime, contentLength || getContentLength(res), event)
      }

      logger.logInput(method, url)
      // log close
      res.once('close', () => {
        logOutput('close')
      })

      // log error
      res.once('error', () => {
        logOutput('error')
      })

      // log finish
      res.once('finish', () => {
        logOutput('finish')
      })

      // log stream pipe response
      res.once('pipe', (readable) => {
        readable.on('data', (chunk) => {
          contentLength += chunk.length
        })
      })
    }

    try {
      return await handleRequest(req, res)
    } catch (error) {
      let message = (config.errorStack ? error?.stack || error?.message : error?.message) ?? ''

      if (!res.headersSent) {
        res.statusCode = error.statusCode ?? 500
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Length', Buffer.byteLength(message))
      }

      if (!res.writableEnded) {
        res.end(Buffer.from(message))
      }
    }
  }

  let server: HttpsPipeline['server'] = () => {
    return options?.tsl ? createServer(options.tsl, handle) : createServer(handle)
  }

  let listen: HttpsPipeline['listen'] = (...args) => {
    return server().listen(...args)
  }

  return {
    ...router,
    handle,
    listen,
    server,
  }
}

export const Https = createHttpsPipeline
