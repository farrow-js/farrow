import { IncomingMessage, ServerResponse } from 'http'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import express, { Express, Request, Response, RequestHandler } from 'express'
import debug from 'debug'
import { match, Path } from 'path-to-regexp'
import { URL } from 'url'

import { createHooks } from './hooks'
import { ContextItem, ContextValue, Context, FARROW_CONTEXT, getContextValue } from './context'
import { Ref, RefValue, RefValueType, FARROW_REF, createRef } from './ref'
import { runMiddlewares, Middleware, Middlewares, Next } from './middleware'

const debugHttp = debug('http')

type PresetHooks = {
  useRequest: () => Request
  useResponse: () => Response
  useContext: <T extends Context>(context: T) => ContextValue<T>
  useRef: <T extends Ref>(ref: T) => RefValue<T>
  useMiddleware: (...middlewares: Middlewares) => void
}

let { run, hooks } = createHooks<PresetHooks>({
  useRequest() {
    throw new Error(`useRequest can't not be called after initilizing`)
  },
  useResponse() {
    throw new Error(`useResponse can't not be called after initilizing`)
  },
  useContext() {
    throw new Error(`useContext can't not be called after initilizing`)
  },
  useRef() {
    throw new Error(`useRef can't not be called after initilizing`)
  },
  useMiddleware() {
    throw new Error(`useMiddleware can't not be called after initilizing`)
  }
})

export const { useRequest, useResponse, useContext, useRef, useMiddleware } = hooks

type CreateRequestListenerOptions = {
  context?: ContextItem
}

export const createExpressMiddleware = (
  initializer: () => void,
  options: CreateRequestListenerOptions = {}
): RequestHandler => {
  if (options.context && !options.context[FARROW_CONTEXT]) {
    throw new Error(`options.context should be a Farrow Context, but received ${options.context}`)
  }

  let requestHandler: RequestHandler = async (req, res, next) => {
    let useRequest = () => {
      return req
    }

    let useResponse = () => {
      return res
    }

    let middlewares: Middlewares = []
    let useMiddleware = (...args: Middlewares) => {
      for (let i = 0; i < args.length; i++) {
        let middleware = args[i]
        // tslint:disable-next-line: strict-type-predicates
        if (typeof middleware !== 'function') {
          throw new Error(`middleware should be a function, but received ${middleware}`)
        }
        middlewares.push(middleware)
      }
    }

    let useContext = (Context: Context): any => {
      if (!Context) {
        throw new Error(`The first argument should be a Context, but received ${Context}`)
      }

      if (options.context) {
        let target = getContextValue(options.context, Context.id)

        if (target) {
          return target.value
        }
      }

      return Context.initialValue
    }

    let refs = new Map<symbol, RefValue<Ref>>()
    let useRef = (Ref: Ref) => {
      if (!Ref || !Ref[FARROW_REF]) {
        throw new Error(`The first argument should be a Ref, but received ${Ref}`)
      }

      let currentSymbol = Ref[FARROW_REF]

      if (refs.has(currentSymbol)) {
        return refs.get(currentSymbol) as RefValue<Ref>
      }

      let ref: RefValue<Ref> = {
        current: null
      }

      refs.set(currentSymbol, ref)

      return ref
    }

    let result = run(initializer, {
      useRequest,
      useResponse,
      useMiddleware,
      useContext,
      useRef
    })

    // tslint:disable-next-line: strict-type-predicates
    if (typeof result !== 'undefined') {
      throw new Error(`Expected initializer function return undefined, but received ${result}`)
    }

    try {
      await runMiddlewares(middlewares, async () => next())
    } catch (error) {
      next(error)
    }
  }

  return requestHandler
}

export const useReq = useRequest
export const useRes = useResponse

export const useHeaders = () => {
  let req = useReq()
  return req.headers
}

const UrlRef = createRef<URL>()

export const useUrl = () => {
  let ref = useRef(UrlRef)

  if (ref.current) {
    return ref.current
  }

  let req = useReq()
  let url = new URL(`http://${req.hostname + req.url || ''}`)

  ref.current = url

  return url
}

export type MiddlewareWithParams<P extends object = object> = (
  params: P,
  next: Next
) => Promise<void>

export type MiddlewaresWithParams<P extends object = object> = MiddlewareWithParams<P>[]

export const useRoute = <T>(
  pattern: Result<T, string>,
  handler: (t: T, next: Next) => Promise<void>
) => {
  useMiddleware(async next => {
    if (pattern.kind === 'Err') {
      return next()
    }

    let value = pattern.value

    return handler(value, next)
  })
}

type Err<T> = {
  kind: 'Err'
  value: T
}

type Ok<T> = {
  kind: 'Ok'
  value: T
}

export type Result<A, B> = Ok<A> | Err<B>

export const Err = <B>(value: B): Result<any, B> => {
  return {
    kind: 'Err',
    value
  }
}

export const Ok = <A>(value: A): Result<A, any> => {
  return {
    kind: 'Ok',
    value
  }
}

export function combine<A, T>(results: [Result<A, string>], f: (a: A) => T): Result<T, string>
export function combine<A, B, T>(
  results: [Result<A, string>, Result<B, string>],
  f: (a: A, b: B) => T
): Result<T, string>
export function combine<A, B, C, T>(
  results: [Result<A, string>, Result<B, string>, Result<C, string>],
  f: (a: A, b: B, c: C) => T
): Result<T, string>
export function combine<A, B, C, D, T>(
  results: [Result<A, string>, Result<B, string>, Result<C, string>, Result<D, string>],
  f: (a: A, b: B, c: C, d: D) => T
): Result<T, string>
export function combine<A, B, C, D, E, T>(
  results: [
    Result<A, string>,
    Result<B, string>,
    Result<C, string>,
    Result<D, string>,
    Result<E, string>
  ],
  f: (a: A, b: B, c: C, d: D, e: E) => T
): Result<T, string>

export function combine<A, B, C, D, E, F, T>(
  results: [
    Result<A, string>,
    Result<B, string>,
    Result<C, string>,
    Result<D, string>,
    Result<E, string>,
    Result<F, string>
  ],
  f: (a: A, b: B, c: C, d: D, e: E, f: F) => T
): Result<T, string>

export function combine<A, B, C, D, E, F, G, T>(
  results: [
    Result<A, string>,
    Result<B, string>,
    Result<C, string>,
    Result<D, string>,
    Result<E, string>,
    Result<F, string>,
    Result<G, string>
  ],
  f: (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => T
): Result<T, string>

export function combine<A, B, C, D, E, F, G, H, T>(
  results: [
    Result<A, string>,
    Result<B, string>,
    Result<C, string>,
    Result<D, string>,
    Result<E, string>,
    Result<F, string>,
    Result<G, string>,
    Result<H, string>
  ],
  f: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H) => T
): Result<T, string>

export function combine<A, B, C, D, E, F, G, H, I, T>(
  results: [
    Result<A, string>,
    Result<B, string>,
    Result<C, string>,
    Result<D, string>,
    Result<E, string>,
    Result<F, string>,
    Result<G, string>,
    Result<H, string>,
    Result<I, string>
  ],
  f: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I) => T
): Result<T, string>

export function combine<A, B, C, D, E, F, G, H, I, J, T>(
  results: [
    Result<A, string>,
    Result<B, string>,
    Result<C, string>,
    Result<D, string>,
    Result<E, string>,
    Result<F, string>,
    Result<G, string>,
    Result<H, string>,
    Result<I, string>,
    Result<J, string>
  ],
  f: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J) => T
): Result<T, string>

export function combine(results: Result<any, any>[], f: (...args: any) => any) {
  let values = []

  for (let i = 0; i < results.length; i++) {
    let result = results[i]
    if (result.kind === 'Ok') {
      values.push(result.value)
    } else {
      return result
    }
  }

  return Ok(f(...values))
}

type Extractor<T, TT = any> = (value: TT) => Result<T, string>

export const useMatchQuery = <T>(f: Extractor<T>) => {
  let req = useReq()
  return f(req.query)
}

export const useMatchBody = <T>(f: Extractor<T>) => {
  let req = useReq()
  let body = req.body

  if (!body) {
    return Err(`req.body is not existed`)
  }

  return f(body)
}

export const useMatchHeaders = <T>(f: Extractor<T>) => {
  let headers = useHeaders()
  return f(headers)
}

export const useMatchPath = <T>(path: Path, f: Extractor<T>): Result<T, string> => {
  let matcher = match(path)
  let url = useUrl()

  let result = matcher(url.pathname)

  if (!result) {
    return Err(`${url.pathname} is not matched by ${path}`)
  }

  return f(result.params)
}
