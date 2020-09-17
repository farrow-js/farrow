import {
  createContextCell,
  createContextManager,
  ContextStorage,
  isContextManager,
  ContextCell,
  ContextManager,
  assertContextManager,
  assertContextCell,
  isContextCell,
  fromManager,
  runContextHooks,
  useCell,
  useCellValue,
  useManager,
} from './context'
import { Next, createCounter } from './counter'

export { Next }

export {
  createContextCell,
  createContextManager,
  ContextStorage,
  ContextCell,
  ContextManager,
  useCellValue,
  useCell,
  useManager,
}

export type Middleware<I = unknown, O = unknown> = (input: I, next: Next<I, O>) => O

export type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[]

export const isPipeline = (input: any): input is Pipeline => {
  return !!(input && input[PipelineSymbol])
}

const PipelineSymbol = Symbol('pipeline')

type PipelineSymbol = typeof PipelineSymbol

export type PipelineOptions<O = unknown> = {
  defaultOutput?: O
  contexts?: ContextStorage
}

export type MaybePromise<T> = T | Promise<T>

export type Pipeline<I = unknown, O = unknown> = {
  [PipelineSymbol]: true
  add: (input: Middleware<I, MaybePromise<O>>) => void
  run: (input: I, manager?: ContextManager) => Promise<O>
}

export const createPipeline = <I, O>(options?: PipelineOptions<O>): Pipeline<I, O> => {
  type Add = Pipeline<I, O>['add']
  type Run = Pipeline<I, O>['run']

  let settings = {
    ...options,
  }

  let currentManager = createContextManager(settings.contexts)
  let currentHooks = fromManager(currentManager)

  let middlewares: Middlewares<I, MaybePromise<O>> = []

  let add: Add = (middleware) => {
    middlewares.push(middleware)
  }

  let run: Run = (input, manager = currentManager) => {
    assertContextManager(manager)

    let hooks = manager === currentManager ? currentHooks : fromManager(manager)

    let counter = createCounter<I, MaybePromise<O>>((index, input, next) => {
      if (index >= middlewares.length) {
        if (settings.defaultOutput !== undefined) {
          return settings.defaultOutput
        }
        throw new Error(`Expect returning a value, but all middlewares just calling next()`)
      }

      let middleware = middlewares[index]
      let result = runContextHooks(() => middleware(input, next), hooks)

      return result
    })

    let result = counter.start(input)

    return Promise.resolve(result)
  }

  return {
    [PipelineSymbol]: true,
    add,
    run,
  }
}

type Request = {
  pathname: string
  method?: string
  body?: Record<string, any>
  query?: Record<string, any>
  cookies?: Record<string, any>
  headers?: Record<string, any>
}

type Response = {
  statusCode: number
  statusMessage: string
  headers: {
    [key: string]: string | number
  }
  body: string | object | null
}

const Json = <T>(data: T): Response => {
  let body = JSON.stringify(data)
  return {
    statusCode: 200,
    statusMessage: 'OK',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  }
}

const Text = (content: string): Response => {
  return {
    statusCode: 200,
    statusMessage: 'OK',
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

const pipeline = createPipeline<Request, Response>()

pipeline.add((request, next) => {
  if (request.query?.name) {
    let query = {
      ...request.query,
      name: `Rewrite(${request.query.name})`,
    }
    return next({
      ...request,
      query,
    })
  } else {
    return next()
  }
})

pipeline.add((request, next) => {
  if (request.query?.name) {
    return Text(`Hello ${request.query?.name ?? 'World'}`)
  } else {
    return next()
  }
})

pipeline.add(async (request, next) => {
  let loggerMap = useCell(LoggerCell)

  let response = await next(request)

  if (loggerMap.value) {
    console.log('logger', [...(loggerMap.value.entries() ?? [])])
  }

  return response
})

type LoggerMap = Map<string, string[]>

const LoggerCell = createContextCell<LoggerMap | null>(null)

const useLogger = (name: string) => {
  let loggerCell = useCell(LoggerCell)

  if (!loggerCell.value) {
    loggerCell.value = new Map()
  }

  let logger = loggerCell.value

  let contents = logger.get(name)

  if (!contents) {
    contents = []
    logger.set(name, contents)
  }

  let result = {
    add: (content: string) => {
      contents?.push(content)
    },
    get: () => {
      return contents
    },
  }

  return result
}

pipeline.add(async (request, next) => {
  let logger = useLogger('time')

  let start = Date.now()

  await sleep(200)

  let response = await next()

  logger.add(`path: ${request.pathname}, take time ${(Date.now() - start).toFixed(2)}ms`)

  return response
})

pipeline.add(async function (request) {
  useLogger('time')
  await sleep(200)
  return Json(request)
})

let result = pipeline
  .run({
    pathname: '/test',
    method: 'POST',
    body: {
      a: 1,
      b: 2,
    },
  })
  .then((response) => {
    console.log('response', response)
  })

let result0 = pipeline
  .run({
    pathname: '/hello',
    method: 'POST',
    query: {
      name: 'Bill',
    },
  })
  .then((response) => {
    console.log('response', response)
  })
