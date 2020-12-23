import fs from 'fs'
import path from 'path'
import { match as createMatch, MatchFunction, Path as Pathname } from 'path-to-regexp'
import { parse as parseQuery } from 'qs'

import { createPipeline, useContainer, MiddlewareInput, Pipeline, Middleware } from 'farrow-pipeline'

import * as Schema from 'farrow-schema'
import { ValidationError } from 'farrow-schema/validator'

import { Validator, createSchemaValidator } from 'farrow-schema/validator'

import { RequestInfo } from './requestInfo'
import { BodyMap } from './responseInfo'
import { route as createRoute } from './basenames'
import { MaybeAsyncResponse, matchBodyType, Response } from './response'
import { MarkReadOnlyDeep, ParseUrl } from './types'
import { HttpError } from './HttpError'
import { fstat } from 'fs'

export { Pathname }

export type RouterSchemaDescriptor =
  | Schema.FieldDescriptors
  | (new () => Schema.ObjectType)
  | (new () => Schema.StructType)

export type RouterSharedSchema = {
  method?: string | string[]
  body?: Schema.FieldDescriptor | Schema.FieldDescriptors
  headers?: RouterSchemaDescriptor
  cookies?: RouterSchemaDescriptor
}

export type RouterRequestSchema = {
  pathname: Pathname
  params?: RouterSchemaDescriptor
  query?: RouterSchemaDescriptor
} & RouterSharedSchema

export type RouterUrlSchema<T extends string = string> = {
  url: T
} & RouterSharedSchema

export const isRouterRequestSchema = (input: any): input is RouterRequestSchema => {
  return !!(input && input.hasOwnProperty('pathname'))
}

export const isRouterUrlSchema = (input: any): input is RouterUrlSchema => {
  return !!(input && input.hasOwnProperty('url'))
}

export type TypeOfRouterRequestField<T> = T extends string
  ? string
  : T extends Schema.FieldDescriptors
  ? Schema.TypeOf<Schema.StructType<T>>
  : T extends Schema.FieldDescriptor
  ? Schema.TypeOfFieldDescriptor<T>
  : never

export type TypeOfRequestSchema<T extends RouterRequestSchema> = MarkReadOnlyDeep<
  {
    [key in keyof T]: TypeOfRouterRequestField<T[key]>
  }
>

export type TypeOfUrlSchema<T extends RouterUrlSchema> = MarkReadOnlyDeep<
  ParseUrl<T['url']> &
    {
      [key in keyof Omit<T, 'url'>]: TypeOfRouterRequestField<Omit<T, 'url'>[key]>
    }
>

const createRequestSchemaValidatorAndMatcher = <T extends RouterRequestSchema>(schema: T) => {
  let descriptors: Schema.FieldDescriptors = {
    pathname: Schema.String,
  }

  if (schema.method) {
    descriptors.method = Schema.String
  }

  if (schema.params) {
    descriptors.params = schema.params
  }

  if (schema.query) {
    descriptors.query = schema.query
  }

  if (schema.body) {
    descriptors.body = schema.body
  }

  if (schema.headers) {
    descriptors.headers = schema.headers
  }

  if (schema.cookies) {
    descriptors.cookies = schema.cookies
  }

  let RequestStruct = Schema.Struct(descriptors)

  let validator = createSchemaValidator(Schema.NonStrict(RequestStruct) as any)

  let matcher = createMatch(schema.pathname)

  return {
    validator: validator as Validator<TypeOfRequestSchema<T>>,
    matcher,
  }
}

const splitUrlPattern = (url: string) => {
  let pathname = ''
  let querystring = ''
  let isQuerystring = false

  for (let i = 0; i < url.length; i++) {
    let item = url.charAt(i)

    if (item === '?' && url.charAt(i + 1) !== ':') {
      isQuerystring = true
      continue
    }

    if (isQuerystring) {
      querystring += item
    } else {
      pathname += item
    }
  }

  return {
    pathname,
    querystring,
  }
}

const SchemaMap = {
  string: Schema.String,
  number: Schema.Number,
  boolean: Schema.Boolean,
  int: Schema.Int,
  float: Schema.Float,
  id: Schema.ID,
}

const createSchemaByString = (str: string): Schema.SchemaCtor => {
  if (SchemaMap.hasOwnProperty(str)) {
    return SchemaMap[str]
  }

  // is union type
  if (str.includes('|')) {
    return Schema.Union(...str.split('|').map(createSchemaByString))
  }

  // is literal string type
  if (str.startsWith('{') && str.endsWith('}')) {
    let value = str.substring(1, str.length - 1)
    return Schema.Literal(value)
  }

  throw new Error(`Unsupported type in url: ${str}`)
}

const resolveUrlPattern = <T extends string>(input: T) => {
  let url = splitUrlPattern(input)
  let params = {} as RouterSchemaDescriptor
  let query = {} as RouterSchemaDescriptor

  let resolve = (source: string, descriptors: RouterSchemaDescriptor) => {
    return source.replace(/<([^>]*)>/g, (match) => {
      let [key, value] = match.substring(1, match.length - 1).split(':')
      let Type = createSchemaByString(value)

      if (key.endsWith('?')) {
        let name = key.substr(0, key.length - 1)
        descriptors[name] = Schema.Nullable(Type)
      } else if (key.endsWith('+') || key.endsWith('*')) {
        let name = key.substr(0, key.length - 1)
        descriptors[name] = key.endsWith('*') ? Schema.Nullable(Schema.List(Type)) : Schema.List(Type)
      } else {
        descriptors[key] = Type
      }

      return `:${key}`
    })
  }

  let pathname = resolve(url.pathname, params)

  let parsedQuery = parseQuery(url.querystring)

  resolve(url.querystring, query)

  for (let [key, item] of Object.entries(parsedQuery)) {
    let isDynamicKey = key.startsWith('<') && key.endsWith('>')
    if (!isDynamicKey) {
      query[key] = Schema.Literal(item + '')
    }
  }

  // console.log('pathname', {
  //   url: input,
  //   pathname,
  //   parsed: url,
  //   query,
  //   params,
  //   parsedQuery
  // })

  return {
    pathname,
    params,
    query,
  }
}

const createUrlSchemaValidatorAndMatcher = <T extends RouterUrlSchema>(schema: T) => {
  let { url, ...rest } = schema
  let { pathname, params, query } = resolveUrlPattern(url)

  let routerRequestSchema: RouterRequestSchema = {
    pathname,
  }

  Object.assign(routerRequestSchema, rest)

  if (Object.keys(params).length) {
    routerRequestSchema.params = params
  }

  if (Object.keys(query).length) {
    routerRequestSchema.query = query
  }

  // ensure pathname come from url
  routerRequestSchema.pathname = pathname

  let result = createRequestSchemaValidatorAndMatcher(routerRequestSchema)

  return {
    ...result,
    validator: result.validator as Validator<TypeOfUrlSchema<T>>,
  }
}

export type HttpMiddleware = Middleware<RequestInfo, MaybeAsyncResponse>

export type HttpMiddlewareInput = MiddlewareInput<RequestInfo, MaybeAsyncResponse>

export type MatchOptions = {
  block?: boolean
  onSchemaError?(error: ValidationError): Response | void | Promise<Response | void>
}

export type RouterSchema = RouterRequestSchema | RouterUrlSchema

export type RouterSchemaValidator<T extends RouterSchema> = T extends RouterRequestSchema
  ? Validator<TypeOfRequestSchema<T>>
  : T extends RouterUrlSchema
  ? Validator<TypeOfUrlSchema<T>>
  : never

export type MatchedPipeline<T extends RouterSchema> = T extends RouterRequestSchema
  ? Pipeline<TypeOfRequestSchema<T>, MaybeAsyncResponse>
  : T extends RouterUrlSchema
  ? Pipeline<TypeOfUrlSchema<T>, MaybeAsyncResponse>
  : never

export type RouterPipeline = Pipeline<RequestInfo, MaybeAsyncResponse> & {
  capture: <T extends keyof BodyMap>(type: T, f: (body: BodyMap[T]) => MaybeAsyncResponse) => void
  route: (name: string) => Pipeline<RequestInfo, MaybeAsyncResponse>
  serve: (name: string, dirname: string) => void
  match<T extends RouterRequestSchema>(
    schema: T,
    options?: MatchOptions,
  ): Pipeline<TypeOfRequestSchema<T>, MaybeAsyncResponse>
  match<U extends string, T extends RouterUrlSchema<U>>(
    schema: T,
    options?: MatchOptions,
  ): Pipeline<TypeOfUrlSchema<T>, MaybeAsyncResponse>
} & RoutingMethods

export type RoutingMethod = <U extends string, T extends RouterSharedSchema>(
  path: U,
  schema?: T,
  options?: MatchOptions,
) => Pipeline<
  MarkReadOnlyDeep<TypeOfUrlSchema<{ url: U; method: string } & (RouterSharedSchema extends T ? {} : T)>>,
  MaybeAsyncResponse
>

export type RoutingMethods = {
  get: RoutingMethod
  post: RoutingMethod
  put: RoutingMethod
  head: RoutingMethod
  delete: RoutingMethod
  patch: RoutingMethod
  options: RoutingMethod
}

export type RouterPipelineOptions = {}

export const createRouterPipeline = (): RouterPipeline => {
  let pipeline = createPipeline<RequestInfo, MaybeAsyncResponse>()

  let capture: RouterPipeline['capture'] = (type, f) => {
    pipeline.use(matchBodyType(type, f))
  }

  let route: RouterPipeline['route'] = (name) => {
    let routePipeline = createRoute(name)
    pipeline.use(routePipeline)
    return routePipeline
  }

  let serve: RouterPipeline['serve'] = (name, dirname) => {
    route(name).use((request, next) => {
      let filename = path.join(dirname, request.pathname)
      let isExist = fs.existsSync(filename)
      if (isExist) {
        return Response.file(filename)
      } else {
        return next(request)
      }
    })
  }

  let createMatchedPipeline = <T>({
    matchedPipeline,
    method,
    options,
    validator,
    matcher,
  }: {
    matchedPipeline: Pipeline<T, MaybeAsyncResponse>
    method: RouterSharedSchema['method']
    options?: MatchOptions
    validator: Validator<T>
    matcher: MatchFunction<object>
  }) => {
    let config = {
      block: true,
      ...options,
    }

    let methods = getMethods(method)

    pipeline.use(async (input, next) => {
      let container = useContainer()

      if (input.method && !methods.includes(input.method.toLowerCase())) {
        return next()
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
        if (config.onSchemaError) {
          let response = await config.onSchemaError(result.value)
          if (response) return response
        }

        let message = result.value.message

        if (result.value.path) {
          message = `path: ${JSON.stringify(result.value.path)}\n` + message
        }

        throw new HttpError(message, 400)
      }

      return matchedPipeline.run(result.value, {
        container: container,
        onLast: () => {
          if (config.block) {
            throw new Error(`Unhandled request: ${input.pathname}`)
          } else {
            return next()
          }
        },
      })
    })

    return matchedPipeline
  }

  let match: RouterPipeline['match'] = (schema: any, options: MatchOptions) => {
    if (isRouterRequestSchema(schema)) {
      let matchedPipeline = createPipeline<any, MaybeAsyncResponse>()
      let { validator, matcher } = createRequestSchemaValidatorAndMatcher(schema)
      return createMatchedPipeline({
        matchedPipeline,
        validator,
        matcher,
        method: schema.method,
        options,
      })
    }

    if (isRouterUrlSchema(schema)) {
      let matchedPipeline = createPipeline<any, MaybeAsyncResponse>()
      let { validator, matcher } = createUrlSchemaValidatorAndMatcher(schema)
      return createMatchedPipeline({
        matchedPipeline,
        validator,
        matcher,
        method: schema.method,
        options,
      })
    }

    throw new Error(`Unsupported schema: {${Object.keys(schema)}}`)
  }

  let createRoutingMethod = (method: string) => {
    return ((<U extends string, T extends Omit<RouterSharedSchema, 'method'>>(
      path: U,
      schema?: T,
      options?: MatchOptions,
    ) => {
      return match(
        {
          ...schema,
          method: method,
          url: path,
        },
        options,
      )
    }) as unknown) as RoutingMethod
  }

  let methods: RoutingMethods = {
    get: createRoutingMethod('GET'),
    post: createRoutingMethod('POST'),
    put: createRoutingMethod('PUT'),
    head: createRoutingMethod('HEAD'),
    delete: createRoutingMethod('DELETE'),
    patch: createRoutingMethod('PATCH'),
    options: createRoutingMethod('OPTIONS'),
  }

  return {
    ...pipeline,
    ...methods,
    capture: capture,
    route: route,
    serve: serve,
    match: match,
  }
}

export const Router = createRouterPipeline

const getMethods = (method: RouterRequestSchema['method']) => {
  let methods = ['get']

  if (Array.isArray(method)) {
    methods = method.map((str) => str.toLowerCase())
  } else if (typeof method === 'string') {
    methods = [method.toLowerCase()]
  }

  return methods
}
