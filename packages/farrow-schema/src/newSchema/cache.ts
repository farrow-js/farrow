import * as S from './newSchema'
import { SchemaCtor, Schema } from './newSchema'

export const Cache = <Value>(getValue: (input: new () => Schema) => Value) => {
  let weakMap = new WeakMap<SchemaCtor, Value>()

  let get = <T extends SchemaCtor>(input: T): Value => {
    let Ctor: new () => Schema

    if (input === Number) {
      Ctor = S.NumberType
    } else if (input === String) {
      Ctor = S.StringType
    } else if (input === Boolean) {
      Ctor = S.BooleanType
    } else {
      Ctor = input as new () => Schema
    }

    if (weakMap.has(Ctor)) {
      return (weakMap.get(Ctor)! as unknown) as Value
    }

    let value = getValue(Ctor)

    weakMap.set(Ctor, value)

    return (value as unknown) as Value
  }

  return {
    get,
  }
}
