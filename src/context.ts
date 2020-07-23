export const FARROW_CONTEXT = Symbol('farrow.context')

export type ContextItem<T = any> = {
  [FARROW_CONTEXT]: {
    [key: string]: { value: T }
  }
}

export const mergeContextItems = (...args: ContextItem[]): ContextItem => {
  let merged = {
    [FARROW_CONTEXT]: {}
  } as ContextItem

  for (let i = 0; i < args.length; i++) {
    Object.assign(merged[FARROW_CONTEXT], args[i][FARROW_CONTEXT])
  }

  return merged
}

export const getContextValue = (ContextItem: ContextItem, id: string) => {
  let obj = ContextItem[FARROW_CONTEXT]

  if (obj && obj.hasOwnProperty(id)) {
    return obj[id]
  }

  return null
}

export type Context<V = any> = {
  id: string
  impl: (
    value: V
  ) => {
    [key: string]: { value: V }
  }
  initialValue: V
  create: (value: V) => ContextItem<V>
}

export type ContextValue<T extends Context> = T extends Context<infer V> ? V : never

let offsetForContext = 0
const getContextId = () => offsetForContext++

export const createContext = <V>(initialValue: V): Context<V> => {
  let id = `farrow.context.${getContextId()}`

  let impl = (value: V) => {
    return {
      [id]: {
        value
      }
    }
  }

  let create = (value: V) => {
    return { [FARROW_CONTEXT]: impl(value) }
  }

  return {
    id,
    initialValue,
    impl,
    create
  }
}