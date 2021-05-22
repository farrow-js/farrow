export type AnyFn = (...args: any) => any

export type Hooks = {
  [key: string]: AnyFn
}

export type AsyncHooks =
  | {
      enable: () => void
      disable: () => void
      set: (value: Hooks) => void
      get: () => Hooks | undefined
      clear: () => void
      entries: () => IterableIterator<[number, Hooks]>
    }
  | undefined

export let asyncHooks: AsyncHooks = undefined

export const impl = (implimentations: AsyncHooks) => {
  asyncHooks = implimentations
}

export const reset = () => {
  asyncHooks = undefined
}
