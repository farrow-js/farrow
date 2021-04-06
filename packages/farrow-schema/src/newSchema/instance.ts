import { Cache } from './cache'
import * as S from './newSchema'
import { SchemaCtor, Schema } from './newSchema'

const instance = Cache((Ctor) => new Ctor())

export type InstanceTypeOf<T extends SchemaCtor | (abstract new () => Schema)> = T extends NumberConstructor
  ? S.NumberType
  : T extends StringConstructor
  ? S.StringType
  : T extends BooleanConstructor
  ? S.BooleanType
  : T extends new () => infer R
  ? R
  : T extends abstract new () => infer R
  ? R
  : never

export const getInstance = <T extends SchemaCtor>(input: T): InstanceTypeOf<T> => {
  return (instance.get(input) as unknown) as InstanceTypeOf<T>
}
