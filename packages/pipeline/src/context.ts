import { createHooks } from './hook'

const ContextSymbol = Symbol('Context')

export type Context<T = any> = {
  id: symbol
  [ContextSymbol]: T
  create: (value: T) => Context<T>
  use: () => {
    value: T
  }
}

export const isContext = (input: any): input is Context => {
  return !!input?.hasOwnProperty(ContextSymbol)
}

type AssertContext = (input: any) => asserts input is Context

export const assertContext: AssertContext = (input) => {
  if (!isContext(input)) {
    throw new Error(`Expected Context, but received ${input}`)
  }
}

export const createContext = <T>(value: T) => {
  let id = Symbol('ContextID')

  let create = (value: T): Context<T> => {
    let use = () => {
      let container = useContainer()
      return Object.seal({
        get value() {
          return container.read(Context)
        },
        set value(v) {
          container.write(Context, v)
        },
      })
    }
    let Context: Context<T> = {
      id,
      [ContextSymbol]: value,
      create,
      use: use,
    }
    return Context
  }

  return create(value)
}

export type ContextStorage = {
  [key: string]: Context
}

export const ContainerSymbol = Symbol('Container')

export type ContextSymbol = typeof ContainerSymbol

export const isContainer = (input: any): input is Container => {
  return !!(input && input[ContainerSymbol])
}

type AssertContainer = (input: any) => asserts input is Container

export const assertContainer: AssertContainer = (input) => {
  if (!isContainer(input)) {
    throw new Error(`Expected Context, but received ${input}`)
  }
}

export type Container = {
  [ContainerSymbol]: true
  read: <V>(Context: Context<V>) => V
  write: <V>(Context: Context<V>, value: V) => void
}

const createContextMap = (storage: ContextStorage) => {
  let contextMap = new Map<symbol, Context>()

  Object.values(storage).forEach((context) => {
    contextMap.set(context.id, context)
  })

  return contextMap
}

export const createContainer = (ContextStorage: ContextStorage = {}): Container => {
  let contextMap = createContextMap(ContextStorage)

  let read: Container['read'] = (context) => {
    let target = contextMap.get(context.id)
    if (target) {
      return target[ContextSymbol]
    }
    return context[ContextSymbol]
  }

  let write: Container['write'] = (context, value) => {
    contextMap.set(context.id, context.create(value))
  }

  let container: Container = Object.freeze({
    [ContainerSymbol]: true,
    read,
    write,
  })

  return container
}

export type Hooks = {
  useContainer: () => Container
}

const { run, hooks } = createHooks<Hooks>({
  useContainer: () => {
    throw new Error(`Can't call useContainer out of scope, it should be placed on top of the function`)
  },
})

export const runHooks = run

export const { useContainer } = hooks

export const fromContainer = (container: Container): Hooks => ({
  useContainer: () => {
    return container
  },
})

export const runWithContainer = <F extends (...args: any) => any>(f: F, container: Container) => {
  return runHooks(f, fromContainer(container))
}
