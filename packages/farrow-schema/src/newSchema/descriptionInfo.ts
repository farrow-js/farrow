import { ObjectType, SchemaCtor } from './newSchema'

export type DescriptionInfo<T extends ObjectType = ObjectType> = {
  [key in keyof T['__type']]?: string
}

export const descriptionWeakMap = new WeakMap<SchemaCtor<ObjectType>, DescriptionInfo>()

export const Description = {
  impl<T extends ObjectType>(Ctor: SchemaCtor<T>, descriptionInfo: DescriptionInfo<T>) {
    descriptionWeakMap.set(Ctor, {
      ...descriptionWeakMap.get(Ctor),
      ...descriptionInfo,
    })
  },
  get<T extends ObjectType>(Ctor: SchemaCtor<T>): DescriptionInfo<T> {
    // eslint-disable-next-line
    new Ctor()
    return descriptionWeakMap.get(Ctor) ?? {}
  },
  getField<T extends ObjectType>(Ctor: SchemaCtor<T>, field: keyof T['__type']) {
    return this.get(Ctor)[field]
  },
}

export const description = (description: string) => {
  return (target: object, key: string) => {
    Description.impl(target.constructor as any, {
      [key]: description,
    })
  }
}
