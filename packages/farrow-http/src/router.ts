import path from 'path'
import { match as createMatch, MatchFunction, Path as Pathname } from 'path-to-regexp'
import { parse as parseQuery } from 'querystring'

import {
  createPipeline,
  createAsyncPipeline,
  useContainer,
  MiddlewareInput,
  Pipeline,
  AsyncPipeline,
  Middleware,
} from 'farrow-pipeline'
import * as Schema from 'farrow-schema'
import type { ValidationError } from 'farrow-schema/validator'
import { Validator, createSchemaValidator } from 'farrow-schema/validator'

import { route as createRoute } from './basenames'
import { MaybeAsyncResponse, matchBodyType, Response } from './response'
import { HttpError } from './HttpError'
import { getStats } from './util'

import type { RequestInfo } from './requestInfo'
import type { BodyMap } from './responseInfo'
import type { MarkReadOnlyDeep, ParseUrl } from './types'

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
  return has(input, 'pathname')
}

export const isRouterUrlSchema = (input: any): input is RouterUrlSchema => {
  return has(input, 'url')
}

export type TypeOfRouterRequestField<T> = T extends string | string[]
  ? string
  : T extends Pathname
  ? string
  : T extends Schema.FieldDescriptor
  ? Schema.TypeOfFieldDescriptor<T>
  : T extends Schema.FieldDescriptors
  ? Schema.TypeOfFieldDescriptors<T>
  : never

export type TypeOfRequestSchema<T extends RouterRequestSchema> = MarkReadOnlyDeep<{
  [key in keyof T]: TypeOfRouterRequestField<T[key]>
}>

export type TypeOfUrlSchema<T extends RouterUrlSchema> = MarkReadOnlyDeep<
  ParseUrl<T['url']> & {
    [key in keyof Omit<T, 'url'>]: TypeOfRouterRequestField<Omit<T, 'url'>[key]>
  }
>

const createRequestSchemaValidatorAndMatcher = <T extends RouterRequestSchema>(schema: T) => {
  const descriptors: Schema.FieldDescriptors = {
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

  const RequestStruct = Schema.Struct(descriptors)

  const validator = createSchemaValidator(Schema.NonStrict(RequestStruct) as any)

  const matcher = createMatch(schema.pathname)

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
    const item = url.charAt(i)

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
  if (has(SchemaMap, str)) {
    return SchemaMap[str]
  }

  // is union type
  if (str.includes('|')) {
    return Schema.Union(...str.split('|').map(createSchemaByString))
  }

  // is literal string type
  if (str.startsWith('{') && str.endsWith('}')) {
    const value = str.substring(1, str.length - 1)
    return Schema.Literal(value)
  }

  throw new Error(`Unsupported type in url: ${str}`)
}

const resolveUrlPattern = <T extends string>(input: T) => {
  const url = splitUrlPattern(input)
  const params = {} as RouterSchemaDescriptor
  const query = {} as RouterSchemaDescriptor

  const resolve = (source: string, descriptors: RouterSchemaDescriptor) => {
    return source.replace(/<([^>]*)>/g, (match) => {
      const [key, value] = match.substring(1, match.length - 1).split(':')
      const Type = createSchemaByString(value)

      if (key.endsWith('?')) {
        const name = key.substr(0, key.length - 1)
        descriptors[name] = Schema.Nullable(Type)
      } else if (key.endsWith('+') || key.endsWith('*')) {
        const name = key.substr(0, key.length - 1)
        descriptors[name] = key.endsWith('*') ? Schema.Nullable(Schema.List(Type)) : Schema.List(Type)
      } else {
        descriptors[key] = Type
      }

      return `:${key}`
    })
  }

  const pathname = resolve(url.pathname, params)

  const parsedQuery = parseQuery(url.querystring)

  resolve(url.querystring, query)

  for (const [key, item] of Object.entries(parsedQuery)) {
    const isDynamicKey = key.startsWith('<') && key.endsWith('>')
    if (!isDynamicKey) {
      query[key] = Schema.Literal(`${item}`)
    }
  }

  return {
    pathname,
    params,
    query,
  }
}

const createUrlSchemaValidatorAndMatcher = <T extends RouterUrlSchema>(schema: T) => {
  const { url, ...rest } = schema
  const { pathname, params, query } = resolveUrlPattern(url)

  const routerRequestSchema: RouterRequestSchema = {
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

  const result = createRequestSchemaValidatorAndMatcher(routerRequestSchema)

  return {
    ...result,
    validator: result.validator as Validator<TypeOfUrlSchema<T>>,
  }
}

export type HttpMiddleware = Middleware<RequestInfo, MaybeAsyncResponse>

export type HttpMiddlewareInput = MiddlewareInput<RequestInfo, MaybeAsyncResponse>

export type MatchOptions = {
  block?: boolean
  onSchemaError?(error: ValidationError): Response | void
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

export type RouterPipeline = AsyncPipeline<RequestInfo, Response> & {
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
  MarkReadOnlyDeep<
    TypeOfUrlSchema<
      {
        url: U
        method: string
      } & (RouterSharedSchema extends T ? {} : T)
    >
  >,
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

export type RouterPipelineOptions = string

export const createRouterPipeline = (): RouterPipeline => {
  const pipeline = createAsyncPipeline<RequestInfo, Response>()

  const capture: RouterPipeline['capture'] = (type, f) => {
    pipeline.use(matchBodyType(type, f))
  }

  const route: RouterPipeline['route'] = (name) => {
    const routePipeline = createRoute(name)
    pipeline.use(routePipeline)
    return routePipeline
  }

  const serve: RouterPipeline['serve'] = (name, dirname) => {
    dirname = path.normalize(dirname)

    const getIndexHtmlPath = (filename: string): string => {
      if (filename.endsWith('/')) {
        return `${filename}index.html`
      }
      return `${filename}/index.html`
    }

    route(name).use((request, next) => {
      // prevent directory traversal attack
      const filename = path.normalize(request.pathname)
      const fullpath = path.join(dirname, filename)
      if (fullpath.indexOf(dirname) !== 0) {
        return next(request)
      }

      return getStats(fullpath).then((stats) => {
        /**
         * handle file
         */
        if (stats?.isFile()) {
          return Response.file(fullpath)
        }

        /**
         * handle {dirname}/index.html
         */
        if (stats?.isDirectory()) {
          const indexHtmlPath = getIndexHtmlPath(fullpath)
          return getStats(indexHtmlPath).then((indexHtmlStats) => {
            if (indexHtmlStats?.isFile()) {
              return Response.file(getIndexHtmlPath(fullpath))
            }
            return next(request)
          })
        }

        return next(request)
      })
    })
  }

  const createMatchedPipeline = <T>({
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
    const config = {
      block: false,
      ...options,
    }

    const methods = getMethods(method)

    pipeline.use((input, next) => {
      const container = useContainer()

      if (input.method && !methods.includes(input.method.toLowerCase())) {
        return next()
      }

      const matches = matcher(input.pathname)

      if (!matches) {
        return next()
      }

      const { params } = matches

      const result = validator({
        ...input,
        params,
      })

      if (result.isErr) {
        if (config.onSchemaError) {
          const response = config.onSchemaError(result.value)
          if (response) return response
        }

        let { message } = result.value

        if (result.value.path) {
          message = `path: ${JSON.stringify(result.value.path)}\n${message}`
        }

        throw new HttpError(message, 400)
      }

      return matchedPipeline.run(result.value, {
        container,
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

  const match: RouterPipeline['match'] = (schema: any, options: MatchOptions) => {
    if (isRouterRequestSchema(schema)) {
      const matchedPipeline = createPipeline<any, MaybeAsyncResponse>()
      const { validator, matcher } = createRequestSchemaValidatorAndMatcher(schema)
      return createMatchedPipeline({
        matchedPipeline,
        validator,
        matcher,
        method: schema.method,
        options,
      })
    }

    if (isRouterUrlSchema(schema)) {
      const matchedPipeline = createPipeline<any, MaybeAsyncResponse>()
      const { validator, matcher } = createUrlSchemaValidatorAndMatcher(schema)
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

  const createRoutingMethod = (method: string) => {
    return (<U extends string, T extends Omit<RouterSharedSchema, 'method'>>(
      path: U,
      schema?: T,
      options?: MatchOptions,
    ) => {
      return match(
        {
          ...schema,
          method,
          url: path,
        },
        options,
      )
    }) as unknown as RoutingMethod
  }

  const methods: RoutingMethods = {
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
    capture,
    route,
    serve,
    match,
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

const has = (target: unknown, key: string | number | symbol) => {
  return Object.prototype.hasOwnProperty.call(target, key)
}
