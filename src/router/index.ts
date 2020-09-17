import { match as createMatch } from 'path-to-regexp'
import type { Stream } from 'stream'
import {
  createPipeline,
  createContextualPipeline,
  createMiddleware,
  createHook,
  createContextCell,
  createContextManager,
  ContextCell,
  useCell,
  Middleware,
  Pipeline,
  Next,
  ContextManager,
  useManager,
  ContextManagerGenerator,
  usePipeline,
} from '../core'

import * as Schema from '../schema'

export type RouterOptions<T extends Schema.MaybeNullable = Schema.MaybeNullable> = {
  pathname: string
  data?: T
  onValidationError?: (error: Schema.ValidationError) => boolean | void
}

export type RouterSchema<T extends RouterOptions> = {
  [key in keyof Omit<T, 'pathname'>]: Omit<T, 'pathname'>[key]
}

export type RequestInfo = {
  pathname: string
  method?: string
  body?: Record<string, any>
  query?: Record<string, any>
  cookies?: Record<string, any>
  headers?: Record<string, any>
}

export type ResponseHeadersInfo = {
  [header: string]: number | string | string[] | undefined
}

export type ResponseInfo = {
  status: number
  statusText: string
  headers?: ResponseHeadersInfo
  body?: Buffer | Stream | string | number | boolean | object | null
}

const createSchema = <T extends RouterOptions>(options: T): RouterSchema<T> => {
  let { pathname, ...rest } = options

  type Key = keyof typeof rest

  let schema = {} as RouterSchema<T>

  for (let key in rest) {
    let value = rest[key as Key]
    schema[key as Key] = value
  }

  return schema
}

export const createRouterPipeline = <T extends RouterOptions>(options: T) => {
  let schema = {
    ...createSchema<T>(options),
    pathname: Schema.String,
  }

  type Data = Schema.RawType<typeof schema>

  let match = createMatch(options.pathname)

  let pipeline = createContextualPipeline<Data, ResponseInfo>()

  let middleware = createMiddleware<RequestInfo, ResponseInfo>(async function* (requestInfo, next) {
    let { pathname, ...input } = requestInfo

    let matches = match(pathname)

    if (!matches) {
      return yield* next()
    }

    let params = matches.params

    let result = Schema.verify((schema as unknown) as Schema.Object, { ...input, pathname, params })

    if (result.kind === 'Err') {
      if (options.onValidationError) {
        options.onValidationError(result)
      }
      throw new Error(result.message)
    }

    let response = yield* usePipeline(pipeline, result.value as Data)

    return response
  })

  let add = pipeline.add

  return {
    middleware,
    add,
  }
}

const Json = <T>(data: T): ResponseInfo => {
  let body = JSON.stringify(data)
  return {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  }
}

const Text = (content: string): ResponseInfo => {
  return {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(content),
    },
    body: content,
  }
}

const sleep = (duration: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

const router = createRouterPipeline({
  method: 'Get',
  pathname: '/user/:userId',
  params: {
    userId: Schema.Number,
  },
})

router.add(async function* (data, next) {
  let start = Date.now()
  let response = yield* next()
  let end = Date.now()

  console.log('router', {
    time: `${(end - start).toFixed(2)}ms`,
    data,
    response,
  })

  return response
})

router.add(async function* (data) {
  await sleep(200)
  return Json(data)
})

const app = createContextualPipeline<RequestInfo, ResponseInfo>()

app.add(router.middleware)

// tslint:disable-next-line: no-floating-promises
app
  .run({
    method: 'Get',
    pathname: '/user/123',
  })
  .then((response) => {
    console.log('response', response)
  })
