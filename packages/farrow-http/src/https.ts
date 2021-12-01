import { createServer, Server } from 'https'
import { parse as parseCookies } from 'cookie'
import { parse as parseQuery } from 'qs'

import { createContainer } from 'farrow-pipeline'

import { handleResponse, HttpHandlerOptions } from './http'
import { Router } from './router'
import { Response } from './response'
import { createLogger } from './logger'
import { handleBasenames, BasenamesContext } from './basenames'
import { RequestContext, RequestInfoContext, ResponseContext } from './context'
import { getBody, getContentLength } from './util'

import type { IncomingMessage, ServerResponse } from 'http'
import type { SecureContextOptions, TlsOptions } from 'tls'
import type { HttpPipelineOptions } from './http'
import type { RouterPipeline } from './router'
import type { RequestCookies, RequestHeaders, RequestQuery } from './requestInfo'
import type { LoggerEvent, LoggerOptions } from './logger'

export type HttpsOptions = SecureContextOptions & TlsOptions

export type HttpsPipelineOptions = HttpPipelineOptions & {
  tsl?: HttpsOptions
}

export type HttpsPipeline = RouterPipeline & {
  handle: (req: IncomingMessage, res: ServerResponse, options?: HttpHandlerOptions) => Promise<void>
  listen: (...args: Parameters<Server['listen']>) => Server
  server: () => Server
}

export const createHttpsPipeline = (options?: HttpsPipelineOptions): HttpsPipeline => {
  const isNotProduction = process.env.NODE_ENV !== 'production'
  const config: HttpsPipelineOptions = {
    logger: isNotProduction,
    errorStack: isNotProduction,
    ...options,
  }

  const loggerOptions: LoggerOptions = !config.logger || typeof config.logger === 'boolean' ? {} : config.logger

  const logger = config.logger ? createLogger(loggerOptions) : null

  const router = Router()

  const handleRequest: HttpsPipeline['handle'] = async (req, res, options) => {
    if (typeof req.url !== 'string') {
      throw new Error(`req.url is not existed`)
    }

    const { url } = req

    const [pathname = '/', search = ''] = url.split('?')

    const method = req.method ?? 'GET'

    const query = (req as any).query ?? (parseQuery(search, config.query) as RequestQuery)

    const body = (req as any).body ?? (await getBody(req, config.body))

    const headers = req.headers as RequestHeaders

    const cookies = parseCookies(req.headers['cookie'] ?? '', config.cookie) as RequestCookies

    const { basename, requestInfo } = handleBasenames(config.basenames ?? [], {
      pathname,
      method,
      query,
      body,
      headers,
      cookies,
    })

    const storages = await config.contexts?.({
      req,
      requestInfo,
      basename,
    })

    const container = createContainer({
      ...storages,
      request: RequestContext.create(req),
      response: ResponseContext.create(res),
      basenames: BasenamesContext.create([basename]),
      requestInfo: RequestInfoContext.create(requestInfo),
    })

    const responser = await router.run(requestInfo, {
      container,
      onLast: () => {
        if (options?.onLast) {
          return Response.custom(options.onLast)
        }
        return Response.status(404).text('404 Not Found')
      },
    })

    await handleResponse({
      req,
      res,
      requestInfo,
      responseInfo: responser.info,
      container,
    })
  }

  const handle: HttpsPipeline['handle'] = async (req, res, options) => {
    if (logger) {
      const startTime = Date.now()
      const method = req.method ?? 'GET'
      const url = req.url ?? ''

      let contentLength = 0

      let hasLogOut = false
      const logOutput = (event: LoggerEvent) => {
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
      return await handleRequest(req, res, options)
    } catch (error: any) {
      const message = (config.errorStack ? error?.stack || error?.message : error?.message) ?? ''

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

  const server: HttpsPipeline['server'] = () => {
    return options?.tsl ? createServer(options.tsl, handle) : createServer(handle)
  }

  const listen: HttpsPipeline['listen'] = (...args) => {
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
