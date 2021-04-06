import { ObjectType, SchemaCtor } from './schema'

export type DeprecatedInfo<T extends ObjectType = ObjectType> = {
  [key in keyof T['__type']]?: string
}

export const DeprecatedWeakMap = new WeakMap<SchemaCtor<ObjectType>, DeprecatedInfo>()

export const Deprecated = {
  impl<T extends ObjectType>(Ctor: SchemaCtor<T>, DeprecatedInfo: DeprecatedInfo<T>) {
    DeprecatedWeakMap.set(Ctor, {
      ...DeprecatedWeakMap.get(Ctor),
      ...DeprecatedInfo,
    })
  },
  get<T extends ObjectType>(Ctor: SchemaCtor<T>): DeprecatedInfo<T> {
    // eslint-disable-next-line
    new Ctor()
    return DeprecatedWeakMap.get(Ctor) ?? {}
  },
  getField<T extends ObjectType>(Ctor: SchemaCtor<T>, field: keyof T['__type']) {
    return this.get(Ctor)[field]
  },
}

export const deprecated = (deprecated: string) => {
  return (target: object, key: string) => {
    Deprecated.impl(target.constructor as any, {
      [key]: deprecated,
    })
  }
}
