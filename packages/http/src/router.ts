import path from 'path'
import { match as createMatch } from 'path-to-regexp'

import { createPipeline, useContext, MiddlewareInput, Pipeline, Middleware } from 'farrow-pipeline'

import * as Schema from 'farrow-schema'
import { Prettier } from 'farrow-schema'

import { Validator, createSchemaValidator } from 'farrow-schema/validator'

import { RequestInfo } from './requestInfo'
import { BodyMap } from './responseInfo'
import { route as createRoute } from './basenames'
import { MaybeAsyncResponse, matchBodyType, Response } from './response'

export type RouterSchemaDescriptor =
  | Schema.FieldDescriptors
  | (new () => Schema.ObjectType)
  | (new () => Schema.StructType)

export type RouterRequestSchema = {
  pathname: string
  method?: string
  params?: RouterSchemaDescriptor
  query?: RouterSchemaDescriptor
  body?: Schema.FieldDescriptor | Schema.FieldDescriptors
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

export type TypeOfRequestSchema<T extends RouterRequestSchema> = Prettier<
  {
    [key in keyof T]: TypeOfRouterRequestField<T[key]>
  }
>

const createRequestValidator = <T extends RouterRequestSchema>(options: T): Validator<TypeOfRequestSchema<T>> => {
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

  return createSchemaValidator(Schema.NonStrict(RequestStruct) as any)
}

export type HttpMiddleware = Middleware<RequestInfo, MaybeAsyncResponse>

export type HttpMiddlewareInput = MiddlewareInput<RequestInfo, MaybeAsyncResponse>

export type RouterPipeline = Pipeline<RequestInfo, MaybeAsyncResponse> & {
  capture: <T extends keyof BodyMap>(type: T, f: (body: BodyMap[T]) => MaybeAsyncResponse) => void
  route: (name: string, ...middlewares: HttpMiddlewareInput[]) => void
  serve: (name: string, dirname: string) => void
  match: <T extends RouterRequestSchema>(
    schema: T,
    ...middlewares: MiddlewareInput<TypeOfRequestSchema<T>, MaybeAsyncResponse>[]
  ) => Pipeline<TypeOfRequestSchema<T>, MaybeAsyncResponse>
}

export type RouterPipelineOptions = {}

export const createRouterPipeline = (): RouterPipeline => {
  let pipeline = createPipeline<RequestInfo, MaybeAsyncResponse>()

  let capture: RouterPipeline['capture'] = (type, f) => {
    pipeline.use(matchBodyType(type, f))
  }

  let route: RouterPipeline['route'] = (name, ...middlewares) => {
    pipeline.use(createRoute(name, ...middlewares))
  }

  let serve: RouterPipeline['serve'] = (name, dirname) => {
    route(name, (request) => {
      let filename = path.join(dirname, request.pathname)
      return Response.file(filename)
    })
  }

  let match = <T extends RouterRequestSchema>(
    schema: T,
    ...middlewares: MiddlewareInput<TypeOfRequestSchema<T>, MaybeAsyncResponse>[]
  ) => {
    let schemaPipeline = createPipeline<TypeOfRequestSchema<T>, MaybeAsyncResponse>()
    let validator = createRequestValidator(schema)

    let matcher = createMatch(schema.pathname)

    schemaPipeline.use(...middlewares)

    pipeline.use((input, next) => {
      let context = useContext()

      if (typeof schema.method === 'string') {
        if (schema.method.toLowerCase() !== input.method?.toLowerCase()) {
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
        let message = result.value.message

        if (result.value.path) {
          message = `path: ${JSON.stringify(result.value.path)}\n` + message
        }

        throw new Error(message)
      }

      return schemaPipeline.run(result.value, {
        context,
        onLast: () => {
          throw new Error(`Unhandled request: ${input.pathname}`)
        },
      })
    })

    return schemaPipeline
  }

  return {
    ...pipeline,
    capture: capture,
    route: route,
    serve: serve,
    match: match,
  }
}

export const Router = createRouterPipeline
