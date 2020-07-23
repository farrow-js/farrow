export const FARROW_REF = Symbol('farrow.ref')

export type Ref<T = any> = {
  [FARROW_REF]: symbol
}

export const createRef = <T>(name = 'ref'): Ref<T> => {
  return {
    [FARROW_REF]: Symbol(name)
  }
}

export type RefValueType<T extends Ref> = T extends Ref<infer V> ? V : never

export type RefValue<T extends Ref> = {
  current: null | RefValueType<T>
}
