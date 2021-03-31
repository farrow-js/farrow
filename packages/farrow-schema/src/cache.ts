import * as S from './schema'
import { SchemaCtor, Schema } from './schema'

export const Cache = <Value>(getValue: (input: new () => Schema) => Value) => {
  let weakMap = new WeakMap<SchemaCtor, Value>()

  let get = <T extends SchemaCtor>(input: T): Value => {
    let Ctor: new () => Schema

    if (input === Number) {
      Ctor = S.Number
    } else if (input === String) {
      Ctor = S.String
    } else if (input === Boolean) {
      Ctor = S.Boolean
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
