import {
  createContextCell,
  createContextManager,
  ContextStorage,
  ContextCell,
  ContextManager,
  assertContextManager,
  fromManager,
  runContextHooks,
  useCell,
  useCellValue,
  useManager,
  Hooks,
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

export type Pipeline<I = unknown, O = unknown> = {
  [PipelineSymbol]: true
  add: (input: Middleware<I, O>) => void
  run: (input: I, manager?: ContextManager) => O
}

export const createPipeline = <I, O>(options?: PipelineOptions<O>): Pipeline<I, O> => {
  type Add = Pipeline<I, O>['add']
  type Run = Pipeline<I, O>['run']

  let settings = {
    ...options,
  }

  let middlewares: Middlewares<I, O> = []

  let add: Add = (middleware) => {
    middlewares.push(middleware)
  }

  let createCurrentCounter = (hooks: Hooks) => {
    return createCounter<I, O>((index, input, next) => {
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
  }

  let currentManager = createContextManager(settings.contexts)
  let currentHooks = fromManager(currentManager)
  let currentCounter = createCurrentCounter(currentHooks)

  let run: Run = (input, manager = currentManager) => {
    assertContextManager(manager)

    let hooks = manager === currentManager ? currentHooks : fromManager(manager)
    let counter = manager === currentManager ? currentCounter : createCurrentCounter(hooks)
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
  let manager = useManager()

  let runPipeline = (input: I): O => {
    return pipeline.run(input, manager)
  }

  return runPipeline
}