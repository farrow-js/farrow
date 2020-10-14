import {
  createCell,
  createContext,
  CellStorage,
  Cell,
  Context,
  assertContext,
  fromContext,
  runContextHooks,
  useCell,
  useCellValue,
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
  useCellValue,
  useCell,
  useContext,
  runWithContext,
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
  onLast?: Next<I, O>
}

export type Pipeline<I = unknown, O = unknown> = {
  [PipelineSymbol]: true
  add: (input: Middleware<I, O>) => void
  run: (input: I, options?: RunPipelineOptions<I, O>) => O
}

export const createPipeline = <I, O>(options?: PipelineOptions): Pipeline<I, O> => {
  type Add = Pipeline<I, O>['add']
  type Run = Pipeline<I, O>['run']

  let settings = {
    ...options,
  }

  let middlewares: Middlewares<I, O> = []

  let add: Add = (middleware) => {
    middlewares.push(middleware)
  }

  let createCurrentCounter = (hooks: Hooks, onLast?: Next<I, O>) => {
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

  let currentContext = createContext(settings.contexts)
  let currentHooks = fromContext(currentContext)
  let currentCounter = createCurrentCounter(currentHooks)

  let run: Run = (input, options) => {
    let context = options?.context ?? currentContext
    let hooks = context === currentContext ? currentHooks : fromContext(context)
    let counter = context === currentContext ? currentCounter : createCurrentCounter(hooks)

    if (options?.onLast) {
      counter = createCurrentCounter(hooks, options.onLast)
    }

    let result = counter.start(input)

    return result
  }

  return {
    [PipelineSymbol]: true,
    add,
    run,
  }
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
