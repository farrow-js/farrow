import {
  createContext,
  createContainer,
  ContextStorage,
  Context,
  Container,
  assertContainer,
  isContext,
  isContainer,
  assertContext,
  fromContainer,
  runHooks,
  useContainer,
  Hooks,
  runWithContainer,
} from './context'

import { Next, createCounter } from './counter'

export { Next }

export {
  createContext,
  createContainer,
  ContextStorage,
  Context,
  Container,
  useContainer,
  runWithContainer,
  assertContainer,
  isContext,
  isContainer,
  assertContext,
}

export type Middleware<I = unknown, O = unknown> = (input: I, next: Next<I, O>) => O

export type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[]

export const isPipeline = (input: any): input is Pipeline => {
  return !!(input && input[PipelineSymbol])
}

const PipelineSymbol = Symbol('pipeline')

type PipelineSymbol = typeof PipelineSymbol

export type PipelineOptions = {
  contexts?: ContextStorage
}

export type RunPipelineOptions<I = unknown, O = unknown> = {
  container?: Container
  onLast?: (input: I) => O
}

export type MiddlewareInput<I = unknown, O = unknown> = Middleware<I, O> | { middleware: Middleware<I, O> }

export type MiddlewareType<T extends MiddlewareInput> = T extends MiddlewareInput<infer I, infer O>
  ? Middleware<I, O>
  : never

export const getMiddleware = <I, O>(input: MiddlewareInput<I, O>) => {
  if (typeof input === 'function') {
    return input
  } else if (input && typeof input.middleware === 'function') {
    return input.middleware
  }
  throw new Error(`${input} is not a Middleware or { middleware: Middleware }`)
}

export type Pipeline<I = unknown, O = unknown> = {
  [PipelineSymbol]: true
  use: (...inputs: MiddlewareInput<I, O>[]) => Pipeline<I, O>
  run: (input: I, options?: RunPipelineOptions<I, O>) => O
  middleware: Middleware<I, O>
}

export const createPipeline = <I, O>(options?: PipelineOptions) => {
  let config = {
    ...options,
  }

  let middlewares: Middlewares<I, O> = []

  let use: Pipeline<I, O>['use'] = (...inputs) => {
    middlewares.push(...inputs.map(getMiddleware))
    return pipeline
  }

  let createCurrentCounter = (hooks: Hooks, onLast?: (input: I) => O) => {
    return createCounter<I, O>((index, input, next) => {
      if (index >= middlewares.length) {
        if (onLast) return onLast(input)
        throw new Error(`Expect returning a value, but all middlewares just calling next()`)
      }

      let middleware = middlewares[index]
      let result = runHooks(() => middleware(input, next), hooks)

      return result
    })
  }

  let currentContainer = createContainer(config.contexts)
  let currentHooks = fromContainer(currentContainer)
  let currentCounter = createCurrentCounter(currentHooks)

  let run: Pipeline<I, O>['run'] = (input, options) => {
    let container = options?.container ?? currentContainer
    let hooks = container === currentContainer ? currentHooks : fromContainer(container)
    let counter = container === currentContainer ? currentCounter : createCurrentCounter(hooks)

    if (options?.onLast) {
      counter = createCurrentCounter(hooks, options.onLast)
    }

    let result = counter.start(input)

    return result
  }

  let middleware: Pipeline<I, O>['middleware'] = (input, next) => {
    let container = useContainer()
    return run(input, {
      container,
      onLast: next,
    })
  }

  let pipeline: Pipeline<I, O> = {
    [PipelineSymbol]: true,
    use,
    run,
    middleware,
  }

  return pipeline
}

export type PipelineInput<T extends Pipeline> = T extends Pipeline<infer I> ? I : never
export type PipelineOutput<T extends Pipeline> = T extends Pipeline<any, infer O> ? O : never

export const usePipeline = <I, O>(pipeline: Pipeline<I, O>) => {
  let container = useContainer()

  let runPipeline = (input: I, options?: RunPipelineOptions<I, O>): O => {
    return pipeline.run(input, { ...options, container })
  }

  return runPipeline
}

export type MaybeAsync<T> = T | Promise<T>

export type ThunkMiddlewareInput<I, O> = () => MaybeAsync<MiddlewareInput<I, MaybeAsync<O>>>

export type AsyncPipeline<I = unknown, O = unknown> = Pipeline<I, MaybeAsync<O>> & {
  useLazy: (thunk: ThunkMiddlewareInput<I, O>) => AsyncPipeline<I, O>
}

export const createAsyncPipeline = <I, O>(options?: PipelineOptions) => {
  let pipeline = createPipeline<I, MaybeAsync<O>>(options)

  let useLazy: AsyncPipeline<I, O>['useLazy'] = (thunk) => {
    let middleware: Middleware<I, MaybeAsync<O>> | null = null
    let promise: Promise<void> | null = null

    pipeline.use((input, next) => {
      if (middleware) return next(input)

      if (!promise) {
        promise = Promise.resolve(thunk()).then((result) => {
          middleware = getMiddleware(result)
        })
      }

      return promise.then(() => next(input))
    })

    pipeline.use((input, next) => {
      if (!middleware) throw new Error(`pipeline.useLazy failed to load middleware`)
      return middleware(input, next)
    })

    return asyncPipeline
  }

  let asyncPipeline: AsyncPipeline<I, O> = {
    ...pipeline,
    useLazy,
  }

  return asyncPipeline
}
