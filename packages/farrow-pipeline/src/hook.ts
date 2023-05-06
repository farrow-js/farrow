import { Hooks, AnyFn, asyncTracer } from './asyncTracerInterface'

export const createHooks = <HS extends Hooks>(defaultHooks: HS) => {
  const hooks = {} as HS

  for (const key in defaultHooks) {
    const f = ((...args) => {
      const hooks = asyncTracer?.get() ?? defaultHooks
      const handler = hooks[key]
      return handler(...args)
    }) as HS[typeof key]

    hooks[key] = f
  }

  const run = <F extends AnyFn>(f: F, implementations: HS): ReturnType<F> => {
    if (asyncTracer) {
      return asyncTracer.run(f, implementations)
    } else {
      return f()
    }
  }

  return { run, hooks }
}
