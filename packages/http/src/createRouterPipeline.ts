import path from 'path'
import { match as createMatch } from 'path-to-regexp'

import { createPipeline, Next, Middleware, RunPipelineOptions, useContext, MiddlewareInput } from 'farrow-pipeline'
import * as Schema from 'farrow-schema'
import { Validator, createStrictValidator, createNonStrictValidator } from 'farrow-schema/validator'

import { MaybeAsyncResponse, match as matchType, Response } from './response'
import { BodyMap } from './responseInfo'
import { route as createRoute } from './basenames'

export type RouterSchemaDescriptor =
  | Schema.FieldDescriptors
  | (new () => Schema.ObjectType)
  | (new () => Schema.StructType)

export type RouterRequestSchema = {
  pathname: string
  method?: string
  params?: RouterSchemaDescriptor
  query?: RouterSchemaDescriptor
  body?: Schema.FieldDescriptor
  headers?: RouterSchemaDescriptor
  cookies?: RouterSchemaDescriptor
}

export type TypeOfRouterRequestField<T> = T extends string
  ? string
  : T extends Schema.FieldDescriptors
  ? Schema.TypeOf<Schema.StructType<T>>
  : T extends Schema.FieldDescriptor
  ? Schema.TypeOfFieldDescriptor<T>
  : never

export type TypeOfRequestSchema<T extends RouterRequestSchema> = {
  [key in keyof T]: TypeOfRouterRequestField<T[key]>
}

class Body extends Schema.ObjectType {
  a = String
}

const request = {
  pathname: '/detail/:id',
  params: {
    id: Number,
  },
  body: Schema.Nullable(Body),
}

type T0 = Schema.Prettier<TypeOfRequestSchema<typeof request>>

const createRequestValidator = <T extends RouterRequestSchema>(
  options: T,
  strict = false,
): Validator<TypeOfRequestSchema<T>> => {
  let descriptors = {} as Schema.FieldDescriptors

  if (typeof options.pathname === 'string') {
    descriptors.pathname = Schema.String
  }

  if (typeof options.method === 'string') {
    descriptors.method = Schema.String
  }

  if (options.params) {
    descriptors.params = options.params
  }

  if (options.query) {
    descriptors.query = options.query
  }

  if (options.body) {
    descriptors.body = options.body
  }

  if (options.headers) {
    descriptors.headers = options.headers
  }

  if (options.cookies) {
    descriptors.cookies = options.cookies
  }

  let RequestStruct = Schema.Struct(descriptors)

  if (strict) {
    return createStrictValidator(RequestStruct) as Validator<TypeOfRequestSchema<T>>
  } else {
    return createNonStrictValidator(RequestStruct) as Validator<TypeOfRequestSchema<T>>
  }
}

export type RouterPipeline<I, O> = {
  middleware: <T extends RouterInput>(input: T, next: Next<T, O>) => O
  add: (...args: [path: string, middleware: MiddlewareInput<I, O>] | [middleware: MiddlewareInput<I, O>]) => void
  run: (input: I, options?: RunPipelineOptions<I, O>) => O
  match: <T extends keyof BodyMap>(type: T, f: (body: BodyMap[T]) => MaybeAsyncResponse) => void
  route: (name: string, middleware: MiddlewareInput<I, O>) => void
  serve: (name: string, dirname: string) => void
}

export type RouterInput = {
  pathname: string
  method?: string
}

export const createRouterPipeline = <T extends RouterRequestSchema>(
  options: T,
): RouterPipeline<TypeOfRequestSchema<T>, MaybeAsyncResponse> => {
  type Input = TypeOfRequestSchema<T>
  type Output = MaybeAsyncResponse
  type ResultPipeline = RouterPipeline<Input, Output>

  let pipeline = createPipeline<Input, Output>()

  let validator = createRequestValidator(options)

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

    let result = validator({
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

  let add: ResultPipeline['add'] = (...args) => {
    if (args.length === 1) {
      pipeline.add(args[0])
    } else {
      route(...args)
    }
  }

  let run = pipeline.run

  let serve: ResultPipeline['serve'] = (name: string, dirname: string) => {
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
