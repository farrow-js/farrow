import { Pipeline, createPipeline, isPipeline, Next, Middleware, Middlewares } from './pipeline'
import {
  createContextCell,
  createContextManager,
  ContextStorage,
  isContextManager,
  ContextCell,
  ContextManager,
  ContextManagerGenerator,
  ContextManagerRequestSymbol,
  ContextManagerSymbol,
  assertContextManager,
  assertContextCell,
  isContextCell,
} from './context'

export { createPipeline, Pipeline, Next, Middleware, Middlewares, isPipeline }

export {
  createContextCell,
  createContextManager,
  isContextManager,
  isContextCell,
  ContextStorage,
  ContextCell,
  ContextManager,
  ContextManagerGenerator,
  assertContextManager,
  assertContextCell,
}

export type ContextualPipelineOptions<O = unknown> = {
  defaultOutput?: O
  contexts?: ContextStorage
}

const defaultOptions: ContextualPipelineOptions<any> = {}

export type ContextualPipeline<I = unknown, O = unknown> = {
  add: (input: Middleware<I, ContextManagerGenerator<O>>) => void
  run: (input: I, currentManager?: ContextManager) => Promise<O>
}

export const createContextualPipeline = <I, O>(
  options: ContextualPipelineOptions<O> = defaultOptions
): ContextualPipeline<I, O> => {
  type Run = ContextualPipeline<I, O>['run']

  let pipeline = createPipeline<I, ContextManagerGenerator<O>>()
  let manager = createContextManager(options.contexts)

  let run: Run = async (input, currentManager = manager) => {
    assertContextManager(currentManager)

    let result = pipeline.run(input)
    return currentManager.run(result)
  }

  return {
    add: pipeline.add,
    run,
  }
}

export const createMiddleware = <I, O>(middleware: Middleware<I, ContextManagerGenerator<O>>) => {
  return middleware
}

type HookFunction<Args extends unknown[] = unknown[], T = unknown> = (
  ...args: Args
) => ContextManagerGenerator<T>

export const createHook = <Args extends unknown[], T>(
  f: HookFunction<Args, T>
): ((...args: Args) => ContextManagerGenerator<T>) => {
  return f
}

export const useManager = createHook(async function* () {
  let manager = yield ContextManagerRequestSymbol
  return manager
})

export const useCell = createHook(async function* <T>(ContextCell: ContextCell<T>) {
  let manager = yield* useManager()

  let cell = {
    get value() {
      return manager.read(ContextCell)
    },
    set value(v) {
      manager.write(ContextCell, v)
    },
  }

  return Object.seal(cell)
})

export const usePipeline = createHook(async function* <I, O>(
  pipeline: ContextualPipeline<I, O>,
  input: I
) {
  let manager = yield* useManager()
  let result = await pipeline.run(input, manager)
  return result
})

export const useCellValue = createHook(async function* <T>(ContextCell: ContextCell<T>) {
  let manager = yield* useManager()
  return manager.read(ContextCell)
})

// type Request = {
//   pathname: string
//   method?: string
//   body?: Record<string, any>
//   query?: Record<string, any>
//   cookies?: Record<string, any>
//   headers?: Record<string, any>
// }

// type Response = {
//   statusCode: number
//   statusMessage: string
//   headers: {
//     [key: string]: string | number
//   }
//   body: string | object | null
// }

// const Json = <T>(data: T): Response => {
//   let body = JSON.stringify(data)
//   return {
//     statusCode: 200,
//     statusMessage: 'OK',
//     headers: {
//       'Content-Type': 'application/json',
//       'Content-Length': Buffer.byteLength(body),
//     },
//     body,
//   }
// }

// const Text = (content: string): Response => {
//   return {
//     statusCode: 200,
//     statusMessage: 'OK',
//     headers: {
//       'Content-Type': 'text/plain',
//       'Content-Length': Buffer.byteLength(content),
//     },
//     body: content,
//   }
// }

// const sleep = (duration: number) => {
//   return new Promise((resolve) => {
//     setTimeout(resolve, duration)
//   })
// }

// const pipeline = createContextualPipeline<Request, Response>()

// pipeline.add(async function* (request, next) {
//   if (request.query?.name) {
//     let nextRequest = {
//       ...request,
//       query: {
//         ...request.query,
//         name: `Rewrite(${request.query.name})`,
//       },
//     }
//     return yield* next(nextRequest)
//   } else {
//     return yield* next()
//   }
// })

// pipeline.add(async function* (request, next) {
//   if (request.query?.name) {
//     return Text(`Hello ${request.query?.name ?? 'World'}`)
//   } else {
//     return yield* next()
//   }
// })

// pipeline.add(async function* (request, next) {
//   let response = yield* next(request)
//   let loggerMap = yield* useCellValue(LoggerCell)

//   if (loggerMap) {
//     console.log('logger', [...(loggerMap?.entries() ?? [])])
//   }

//   return response
// })

// type LoggerMap = Map<string, string[]>

// const LoggerCell = createContextCell<LoggerMap | null>(null)

// const useLogger = createHook(async function* (name: string) {
//   let loggerCell = yield* useCell(LoggerCell)

//   if (!loggerCell.value) {
//     loggerCell.value = new Map()
//   }

//   let logger = loggerCell.value

//   let contents = logger.get(name)

//   if (!contents) {
//     contents = []
//     logger.set(name, contents)
//   }

//   let result = {
//     add: (content: string) => {
//       contents?.push(content)
//     },
//   }

//   return result
// })

// pipeline.add(async function* (request, next) {
//   let start = Date.now()
//   let logger = yield* useLogger('time')
//   let response = yield* next()

//   logger.add(`path: ${request.pathname}, take time ${(Date.now() - start).toFixed(2)}ms`)

//   return response
// })

// pipeline.add(async function* (request) {
//   await sleep(500)
//   return Json(request)
// })

// let result = pipeline
//   .run({
//     pathname: '/test',
//     method: 'POST',
//     body: {
//       a: 1,
//       b: 2,
//     },
//   })
//   .then((response) => {
//     console.log('response', response)
//   })

// let result0 = pipeline
//   .run({
//     pathname: '/hello',
//     method: 'POST',
//     query: {
//       name: 'Bill',
//     },
//   })
//   .then((response) => {
//     console.log('response', response)
//   })
