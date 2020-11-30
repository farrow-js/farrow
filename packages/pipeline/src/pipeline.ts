import {
  createCell,
  createContext,
  CellStorage,
  Cell,
  Context,
  assertContext,
  isCell,
  isContext,
  assertCell,
  fromContext,
  runContextHooks,
  useContext,
  Hooks,
  runWithContext,
} from './context'

import { Next, createCounter } from './counter'

export { Next }

export {
  createCell,
  createContext,
  CellStorage,
  Cell,
  Context,
  useContext,
  runWithContext,
  assertContext,
  isCell,
  isContext,
  assertCell,
}

export type Middleware<I = unknown, O = unknown> = (input: I, next: Next<I, O>) => O

export type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[]

export const isPipeline = (input: any): input is Pipeline => {
  return !!(input && input[PipelineSymbol])
}

const PipelineSymbol = Symbol('pipeline')

type PipelineSymbol = typeof PipelineSymbol

export type PipelineOptions = {
  contexts?: CellStorage
}

export type RunPipelineOptions<I = unknown, O = unknown> = {
  context?: Context
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
      let result = runContextHooks(() => middleware(input, next), hooks)

      return result
    })
  }

  let currentContext = createContext(config.contexts)
  let currentHooks = fromContext(currentContext)
  let currentCounter = createCurrentCounter(currentHooks)

  let run: Pipeline<I, O>['run'] = (input, options) => {
    let context = options?.context ?? currentContext
    let hooks = context === currentContext ? currentHooks : fromContext(context)
    let counter = context === currentContext ? currentCounter : createCurrentCounter(hooks)

    if (options?.onLast) {
      counter = createCurrentCounter(hooks, options.onLast)
    }

    let result = counter.start(input)

    return result
  }

  let middleware: Pipeline<I, O>['middleware'] = (input, next) => {
    let context = useContext()
    return run(input, {
      context,
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
  let context = useContext()

  let runPipeline = (input: I, options?: RunPipelineOptions<I, O>): O => {
    return pipeline.run(input, { ...options, context })
  }

  return runPipeline
}
