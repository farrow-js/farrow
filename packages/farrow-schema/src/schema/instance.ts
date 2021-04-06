import { Cache } from './cache'
import * as S from './schema'
import { SchemaCtor, Schema } from './schema'

const instance = Cache((Ctor) => new Ctor())

export type InstanceTypeOf<T extends SchemaCtor | (abstract new () => Schema)> = T extends NumberConstructor
  ? S.Number
  : T extends StringConstructor
  ? S.String
  : T extends BooleanConstructor
  ? S.Boolean
  : T extends new () => infer R
  ? R
  : T extends abstract new () => infer R
  ? R
  : never

export const getInstance = <T extends SchemaCtor>(input: T): InstanceTypeOf<T> => {
  return (instance.get(input) as unknown) as InstanceTypeOf<T>
}
