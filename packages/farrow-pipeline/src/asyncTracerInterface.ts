export type AnyFn = (...args: any) => any

export type Hooks = {
  [key: string]: AnyFn
}

export type AsyncTracer = {
  run: <F extends AnyFn>(f: F, implementations: Hooks) => ReturnType<F>
  get: () => Hooks | undefined
}

export let asyncTracer: AsyncTracer | undefined = undefined

export const impl = (implementations: AsyncTracer) => {
  asyncTracer = implementations
}

export const reset = () => {
  asyncTracer = undefined
}
