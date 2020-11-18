import path from 'path'
import { match as createMatch } from 'path-to-regexp'
import { createPipeline, Next, Middleware, RunPipelineOptions, useContext } from 'farrow-pipeline'
import * as Schema from 'farrow-schema'
import { MaybeAsyncResponse, match as matchType, Response } from './response'
import { BodyMap } from './responseInfo'
import { route as createRoute } from './basenames'

export type RouterPipelineOptions = {
  pathname: string
  method?: string
  params?: Schema.Type
  query?: Schema.Type
  body?: Schema.Type
  headers?: Schema.Type
  cookies?: Schema.Type
}

export type RequestSchema<T extends RouterPipelineOptions> = Schema.Type<
  {
    [key in keyof T]: T[key] extends Schema.Type ? Schema.RawType<T[key]> : T[key]
  }
>

const createRequestSchema = <T extends RouterPipelineOptions>(options: T): RequestSchema<T> => {
  let fileds: Schema.Fields = {}

  for (let key in options) {
    let value = options[key]
    if (Schema.isType(value)) {
      fileds[key] = value
      // tslint:disable-next-line: strict-type-predicates
    } else if (typeof value === 'string') {
      fileds[key] = Schema.string
    } else {
      throw new Error(`Unknown option, ${key}: ${value}`)
    }
  }

  return Schema.object(fileds) as RequestSchema<T>
}

export type RouterRequest<T extends RouterPipelineOptions> = Schema.RawType<RequestSchema<T>>

export type RouterPipeline<I, O> = {
  middleware: <T extends RouterInput>(input: T, next: Next<T, O>) => O
  add: (input: Middleware<I, O>) => void
  run: (input: I, options?: RunPipelineOptions<I, O>) => O
  match: <T extends keyof BodyMap>(type: T, f: (body: BodyMap[T]) => MaybeAsyncResponse) => void
  route: (name: string, middleware: Middleware<I, O>) => void
  serve: (name: string, dirname: string) => void
}

export type RouterInput = {
  pathname: string
  method?: string
}

export const createRouterPipeline = <T extends RouterPipelineOptions>(
  options: T,
): RouterPipeline<RouterRequest<T>, MaybeAsyncResponse> => {
  type Input = RouterRequest<T>
  type Output = MaybeAsyncResponse
  type ResultPipeline = RouterPipeline<Input, Output>

  let pipeline = createPipeline<Input, Output>()

  let schema: Schema.Type<Input> = createRequestSchema(options)

  let matcher = createMatch(options.pathname)

  let middleware: ResultPipeline['middleware'] = function (input, next) {
    let context = useContext()

    if (typeof options.method === 'string') {
      if (options.method.toLowerCase() !== input.method?.toLowerCase()) {
        return next()
      }
    }

    let matches = matcher(input.pathname)

    if (!matches) {
      return next()
    }

    let params = matches.params

    let result = schema.validate({
      ...input,
      params,
    })

    if (result.isErr) {
      throw new Error(result.value.message)
    }

    return pipeline.run(result.value, {
      context,
      onLast: () => next(),
    })
  }

  let match: ResultPipeline['match'] = (type, f) => {
    pipeline.add(matchType(type, f))
  }

  let route: ResultPipeline['route'] = (name, middleware) => {
    pipeline.add(createRoute(name, middleware))
  }

  let add = (
    ...args: [path: string, middleware: Middleware<Input, Output>] | [middleware: Middleware<Input, Output>]
  ) => {
    if (args.length === 1) {
      pipeline.add(args[0])
    } else {
      route(...args)
    }
  }

  let run = pipeline.run

  let serve = (name: string, dirname: string) => {
    route(name, (request) => {
      let filename = path.join(dirname, request.pathname)
      return Response.file(filename)
    })
  }

  return {
    middleware,
    add: add,
    run: run,
    match: match,
    route: route,
    serve: serve,
  }
}
