type AnyFn = (...args: any) => any

type Hooks = {
  [key: string]: AnyFn
}

type DefaultHooks<HS extends Hooks> = {
  [key in keyof HS]: (...args: Parameters<HS[key]>) => never
}

export const createHooks = <HS extends Hooks>(defaultHooks: DefaultHooks<HS>) => {
  let currentHooks: Hooks = {}

  let hooks = {} as HS

  for (let key in defaultHooks) {
    let f = ((...args) => {
      let handler = currentHooks[key]
      // tslint:disable-next-line: strict-type-predicates
      if (typeof handler !== 'function') {
        handler = defaultHooks[key]
      }
      return handler(...args)
    }) as HS[typeof key]

    hooks[key] = f
  }

  let run = <F extends AnyFn>(f: F, implementations: HS): ReturnType<F> => {
    try {
      currentHooks = implementations || defaultHooks
      return f()
    } finally {
      currentHooks = defaultHooks
    }
  }

  return { run, hooks }
}
