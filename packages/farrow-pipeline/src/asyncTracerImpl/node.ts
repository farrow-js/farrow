import { AsyncLocalStorage } from 'async_hooks'
import { AsyncTracer, Hooks, impl, reset } from '../asyncTracerInterface'

const createAsyncTracer = (): AsyncTracer => {
  const asyncLocalStorage = new AsyncLocalStorage<Hooks>()

  return {
    run: (f, implementations) => {
      return asyncLocalStorage.run(implementations, f)
    },
    get: () => {
      return asyncLocalStorage.getStore()
    },
  }
}

export const enable = () => {
  const asyncTracer = createAsyncTracer()
  impl(asyncTracer)
}

export const disable = () => {
  reset()
}
