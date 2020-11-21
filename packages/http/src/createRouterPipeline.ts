import path from 'path'
import { match as createMatch } from 'path-to-regexp'

import { createPipeline, Next, Middleware, RunPipelineOptions, useContext } from 'farrow-pipeline'
import * as Schema from 'farrow-schema'
import { Validator, createValidator, createNonStrictValidator } from 'farrow-schema/validator'

import { MaybeAsyncResponse, match as matchType, Response } from './response'
import { BodyMap } from './responseInfo'
import { route as createRoute } from './basenames'

export type RouterSchemaDescriptor =
  | Schema.FieldDescriptors
  | Schema.SchemaCtor<Schema.ObjectType>
  | Schema.SchemaCtor<Schema.StructType>

export type TypeOfRouterSchemaDescriptor<T extends RouterSchemaDescriptor> = T extends Schema.FieldDescriptors
  ? Schema.TypeOfSchemaCtor<Schema.StructType<T>>
  : Schema.TypeOfSchemaCtor<T>

export type RouterRequestSchema = {
  pathname: string
  method?: string
  params?: RouterSchemaDescriptor
  query?: RouterSchemaDescriptor
  body?: RouterSchemaDescriptor
  headers?: RouterSchemaDescriptor
  cookies?: RouterSchemaDescriptor
}

export type TypeOfRequestSchema<T extends RouterRequestSchema> = {
  [key in keyof T]: T[key] extends RouterSchemaDescriptor ? TypeOfRouterSchemaDescriptor<T[key]> : T[key]
}

class Params extends Schema.ObjectType {
  id = Schema.Int
}

const request = {
  pathname: '/detail/id',
  method: 'POST',
  params: Params,
  query: Schema.Struct({
    tab: String,
  }),
}

type Req = TypeOfRequestSchema<typeof request>

const createRequestValidator = <T extends RouterRequestSchema>(
  options: T,
  strict = false,
): Validator<TypeOfRequestSchema<T>> => {
  let { params, query, body, headers, cookies } = options

  let Request = Schema.Struct({
    pathname: Schema.String,
    method: typeof options.method === 'string' ? Schema.String : null,
    params: typeof params === 'function' ? params : params ? Schema.Struct(params) : null,
    query: typeof query === 'function' ? query : query ? Schema.Struct(query) : null,
    body: typeof body === 'function' ? body : body ? Schema.Struct(body) : null,
    headers: typeof headers === 'function' ? headers : headers ? Schema.Struct(headers) : null,
    cookies: typeof cookies === 'function' ? cookies : cookies ? Schema.Struct(cookies) : null,
  })
}

export type RouterRequest<T extends RouterRequestSchema> = Schema.RawType<TypeOfRequestSchema<T>>

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

export const createRouterPipeline = <T extends RouterRequestSchema>(
  options: T,
): RouterPipeline<RouterRequest<T>, MaybeAsyncResponse> => {
  type Input = RouterRequest<T>
  type Output = MaybeAsyncResponse
  type ResultPipeline = RouterPipeline<Input, Output>

  let pipeline = createPipeline<Input, Output>()

  let schema: Schema.Type<Input> = createRequestValidator(options)

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
