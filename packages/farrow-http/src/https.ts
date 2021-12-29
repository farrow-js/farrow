import { createServer, Server } from 'https'
import { parse as parseCookies } from 'cookie'
import { parse as parseQuery } from 'qs'

import { createContainer } from 'farrow-pipeline'

import { handleResponse, HttpHandlerOptions, NOT_FOUND_RESPONSE } from './http'
import { Router } from './router'
import { Response } from './response'
import { createLogger } from './logger'
import { handleBasenames, BasenamesContext } from './basenames'
import { RequestContext, RequestInfoContext, ResponseContext } from './context'
import { getBody, getContentLength, isPromise } from './util'

import type { IncomingMessage, ServerResponse } from 'http'
import type { SecureContextOptions, TlsOptions } from 'tls'
import type { HttpPipelineOptions } from './http'
import type { RouterPipeline } from './router'
import type { RequestCookies, RequestHeaders, RequestQuery } from './requestInfo'
import type { LoggerEvent, LoggerOptions } from './logger'

export type HttpsOptions = SecureContextOptions & TlsOptions

export type HttpsPipelineOptions = HttpPipelineOptions & {
  tls?: HttpsOptions
}

export type HttpsPipeline = RouterPipeline & {
  handle: (req: IncomingMessage, res: ServerResponse, options?: HttpHandlerOptions) => void
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

  const handleRequest: HttpsPipeline['handle'] = (req, res, options) => {
    if (typeof req.url !== 'string') {
      throw new Error(`req.url is not existed`)
    }

    const { url } = req

    const [pathname = '/', search = ''] = url.split('?')

    const method = req.method ?? 'GET'

    const query = (req as any).query ?? (parseQuery(search, config.query) as RequestQuery)

    const headers = req.headers as RequestHeaders

    const cookies = parseCookies(req.headers['cookie'] ?? '', config.cookie) as RequestCookies

    const handleBody = (body: any) => {
      const { basename, requestInfo } = handleBasenames(config.basenames ?? [], {
        pathname,
        method,
        query,
        body,
        headers,
        cookies,
      })

      const storages = config.contexts?.({
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

      const maybeAsyncResponse = router.run(requestInfo, {
        container,
        onLast: () => {
          if (options?.onLast) {
            return Response.custom(options.onLast)
          }
          return NOT_FOUND_RESPONSE
        },
      })

      if (isPromise(maybeAsyncResponse)) {
        return maybeAsyncResponse.then((response) =>
          handleResponse({
            req,
            res,
            requestInfo,
            responseInfo: response.info,
            container,
          }),
        )
      }
      return handleResponse({
        req,
        res,
        requestInfo,
        responseInfo: maybeAsyncResponse.info,
        container,
      })
    }

    if ((req as any).body) {
      return handleBody((req as any).body)
    }
    const maybeAsyncBody = getBody(req, config.body)
    if (maybeAsyncBody) {
      return maybeAsyncBody
        .then((body) => handleBody(body))
        .catch((err) => {
          throw err
        })
    }
    return handleBody(maybeAsyncBody)
  }

  const handle: HttpsPipeline['handle'] = (req, res, options) => {
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
      return handleRequest(req, res, options)
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
    return options?.tls ? createServer(options.tls, handle) : createServer(handle)
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
