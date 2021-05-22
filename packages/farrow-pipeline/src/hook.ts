import { Hooks, AnyFn, asyncHooks } from './asyncHooksInterface'

export const createHooks = <HS extends Hooks>(defaultHooks: HS) => {
  let currentHooks = {} as HS

  const hooks = {} as HS

  for (const key in defaultHooks) {
    const f = ((...args) => {
      const hooks = currentHooks === defaultHooks ? asyncHooks?.get() ?? defaultHooks : currentHooks
      let handler = hooks[key]
      // tslint:disable-next-line: strict-type-predicates
      if (typeof handler !== 'function') {
        handler = defaultHooks[key]
      }
      return handler(...args)
    }) as HS[typeof key]

    hooks[key] = f
  }

  const run = <F extends AnyFn>(f: F, implementations: HS): ReturnType<F> => {
    try {
      currentHooks = implementations || defaultHooks
      asyncHooks?.set(currentHooks)
      return f()
    } finally {
      currentHooks = defaultHooks
    }
  }

  return { run, hooks }
}
