import {
  ObjectType,
  StructType,
  getInstance,
  FieldDescriptors,
  isFieldDescriptor,
  Struct,
  SchemaField,
  FieldDescriptor,
  isFieldDescriptors,
  FieldInfo,
  TypeOf,
} from './schema'
import * as S from './schema'

export const field = <T extends FieldInfo>(fieldInfo: T): T => {
  return fieldInfo
}

export const pickStruct = <T extends StructType, Keys extends (keyof T['descriptors'])[]>(
  Ctor: new () => T,
  keys: Keys,
) => {
  const instance = getInstance(Ctor)
  const descriptors = {} as FieldDescriptors

  for (const key in instance.descriptors) {
    if (keys.includes(key as keyof T['descriptors'])) {
      const value = instance.descriptors[key]
      descriptors[key] = value
    }
  }

  return Struct(descriptors as Pick<T['descriptors'], Keys[number]>)
}

export const omitStruct = <T extends StructType, Keys extends (keyof T['descriptors'])[]>(
  Ctor: new () => T,
  keys: Keys,
) => {
  const instance = getInstance(Ctor)
  const descriptors = {} as FieldDescriptors

  for (const key in instance.descriptors) {
    if (!keys.includes(key as keyof T['descriptors'])) {
      const value = instance.descriptors[key]
      descriptors[key] = value
    }
  }

  return Struct(descriptors as Omit<T['descriptors'], Keys[number]>)
}

export type PickObject<T extends ObjectType, Keys extends SchemaField<T, keyof T>[]> = new () => {
  [K in Keys[number]]: T[K] extends FieldDescriptor ? T[K] : T[K] extends S.SchemaCtorInput ? T[K] : never
} & ObjectType
export const pickObject = <T extends ObjectType, Keys extends SchemaField<T, keyof T>[]>(
  Ctor: new () => T,
  keys: Keys,
) => {
  const instance = getInstance(Ctor)

  return class PickedObject extends ObjectType {
    constructor() {
      super()
      if (instance instanceof ObjectType) {
        for (const key of Object.keys(instance)) {
          if (keys.includes(key as any)) {
            // @ts-ignore
            const value = instance[key]
            if (isFieldDescriptor(value) || isFieldDescriptors(value)) {
              Object.defineProperty(this, key, {
                enumerable: true,
                value: value,
              })
            }
          }
        }
      }
    }
  } as PickObject<T, Keys>
}

export type OmitObject<T extends ObjectType, Keys extends SchemaField<T, keyof T>[]> = new () => {
  [K in keyof T as K extends Keys[number] | '__type' ? never : K]: T[K] extends FieldDescriptor
    ? T[K]
    : T[K] extends S.SchemaCtorInput
    ? T[K]
    : never
} & ObjectType

export const omitObject = <T extends ObjectType, Keys extends SchemaField<T, keyof T>[]>(
  Ctor: new () => T,
  keys: Keys,
) => {
  const instance = getInstance(Ctor)
  return class OmittedObject extends ObjectType {
    constructor() {
      super()
      if (instance instanceof ObjectType) {
        for (const key of Object.keys(instance)) {
          if (!keys.includes(key as any)) {
            // @ts-ignore
            const value = instance[key]
            if (isFieldDescriptor(value) || isFieldDescriptors(value)) {
              Object.defineProperty(this, key, {
                enumerable: true,
                value: value,
              })
            }
          }
        }
      }
    }
  } as OmitObject<T, Keys>
}

export type PickSchema = typeof pickObject & typeof pickStruct

export const pick = ((Ctor: any, keys: any) => {
  if (Ctor?.prototype instanceof ObjectType) {
    return pickObject(Ctor, keys)
  }

  if (Ctor?.prototype instanceof StructType) {
    return pickStruct(Ctor, keys)
  }

  throw new Error(`Unknown Schema Constructor: ${Ctor}`)
}) as PickSchema

export type OmitSchema = typeof omitObject & typeof omitStruct

export const omit = ((Ctor: any, keys: any) => {
  if (Ctor?.prototype instanceof ObjectType) {
    return omitObject(Ctor, keys)
  }

  if (Ctor?.prototype instanceof StructType) {
    return omitStruct(Ctor, keys)
  }

  throw new Error(`Unknown Schema Constructor: ${Ctor}`)
}) as OmitSchema

export const keyofStruct = <T extends StructType>(Ctor: new () => T): (keyof T['descriptors'])[] => {
  return Object.keys(getInstance(Ctor).descriptors)
}

export const keyofObject = <T extends ObjectType>(Ctor: new () => T): (keyof TypeOf<T>)[] => {
  const instance = getInstance(Ctor)
  const keys = [] as (keyof TypeOf<T>)[]

  for (const key of Object.keys(instance)) {
    // @ts-ignore
    const value = instance[key]
    if (isFieldDescriptor(value)) {
      keys.push(key as keyof TypeOf<T>)
    } else if (isFieldDescriptors(value)) {
      keys.push(key as keyof TypeOf<T>)
    }
  }
  return keys
}

export type KeyOfSchema = typeof keyofStruct & typeof keyofObject

export const keyof = ((Ctor: any) => {
  if (Ctor?.prototype instanceof ObjectType) {
    return keyofObject(Ctor)
  }

  if (Ctor?.prototype instanceof StructType) {
    return keyofStruct(Ctor)
  }

  throw new Error(`Unknown Schema Constructor: ${Ctor}`)
}) as KeyOfSchema

export type SchemaCtorFields = {
  [key: string]: S.FieldInfo
}

export const getSchemaCtorFields = (descriptors: S.FieldDescriptors): SchemaCtorFields => {
  const fields = {} as SchemaCtorFields

  for (const [key, field] of Object.entries(descriptors)) {
    if (S.isFieldDescriptor(field)) {
      if (typeof field === 'function') {
        fields[key] = {
          [S.Type]: field,
        }
      } else {
        fields[key] = field
      }
    } else if (S.isFieldDescriptors(field)) {
      fields[key] = {
        [S.Type]: S.Struct(getSchemaCtorFields(field)),
      }
    }
  }

  return fields
}

export abstract class PartialType extends S.Schema {
  __type!: Partial<TypeOf<this['Item']>>
  abstract Item: S.SchemaCtor
}

const getPartialFields = (fields: FieldDescriptors) => {
  const descriptors = {} as S.FieldDescriptors

  for (const [key, value] of Object.entries(getSchemaCtorFields(fields))) {
    descriptors[key] = {
      ...value,
      [S.Type]: S.isOptionalType(value[S.Type]) ? value[S.Type] : S.Optional(value[S.Type]),
    }
  }

  return descriptors
}

export const partialStruct = <T extends StructType>(Ctor: new () => T) => {
  const instance = getInstance(Ctor)

  return class partial extends PartialType {
    Item = S.Struct(getPartialFields(instance.descriptors)) as unknown as typeof Ctor
  }
}

export type PartialObjectType<T extends ObjectType> = new () => {
  [K in keyof T as K extends '__type' ? never : K]?: T[K] extends FieldDescriptor
    ? T[K]
    : T[K] extends S.SchemaCtorInput
    ? T[K]
    : never
} & ObjectType
export const partialObject = <T extends ObjectType>(Ctor: new () => T) => {
  const instance = getInstance(Ctor)

  return class PartialObject extends ObjectType {
    constructor() {
      super()
      for (const key of Object.keys(instance)) {
        // @ts-ignore
        const value = instance[key]
        if (isFieldDescriptor(value) || isFieldDescriptors(value)) {
          Object.defineProperty(this, key, {
            enumerable: true,
            // @ts-ignore
            value: S.isOptionalType(value) ? value : S.Optional(value),
          })
        }
      }
    }
  } as unknown as PartialObjectType<T>
}

export const partial: typeof partialStruct & typeof partialObject = (
  Ctor: new () => S.ObjectType | S.StructType,
): any => {
  if (Ctor?.prototype instanceof ObjectType) {
    return partialObject(Ctor as any)
  }

  if (Ctor?.prototype instanceof StructType) {
    return partialStruct(Ctor as any)
  }

  throw new Error(`Unknown Schema Constructor: ${Ctor}`)
}

const getRequiredFields = (fields: FieldDescriptors): FieldDescriptors => {
  const descriptors = {} as FieldDescriptors

  for (const [key, value] of Object.entries(fields)) {
    if (isFieldDescriptor(value)) {
      descriptors[key] = S.isOptionalType(value) ? getInstance(value).Item : value
    } else if (isFieldDescriptors(value)) {
      descriptors[key] = getRequiredFields(value)
    }
  }

  return descriptors
}

export const requiredStruct = <T extends StructType>(Ctor: new () => T) => {
  const instance = getInstance(Ctor)
  const descriptors = {} as FieldDescriptors
  for (const [key, value] of Object.entries(instance.descriptors)) {
    if (isFieldDescriptor(value)) {
      descriptors[key] = S.isOptionalType(value) ? getInstance(value).Item : value
    } else if (isFieldDescriptors(value)) {
      descriptors[key] = getRequiredFields(value)
    }
  }

  const requiredStruct = Struct(descriptors)
  return requiredStruct
}

export type RequiredObjectType<T extends ObjectType> = new () => {
  [K in keyof T as K extends '__type' ? never : K]: T[K] extends FieldDescriptor
    ? T[K]
    : T[K] extends S.SchemaCtorInput
    ? T[K]
    : never
} & ObjectType

export const requiredObject = <T extends ObjectType>(Ctor: new () => T) => {
  const instance = getInstance(Ctor)

  return class RequiredObject extends ObjectType {
    constructor() {
      super()
      for (const key of Object.keys(instance)) {
        // @ts-ignore
        const value = instance[key]
        if (isFieldDescriptor(value) || isFieldDescriptors(value)) {
          Object.defineProperty(this, key, {
            enumerable: true,
            value: S.isOptionalType(value) ? getInstance(value).Item : value,
          })
        }
      }
    }
  } as RequiredObjectType<T>
}

export const required: typeof requiredStruct & typeof requiredObject = (
  Ctor: new () => S.ObjectType | S.StructType,
): any => {
  if (Ctor?.prototype instanceof ObjectType) {
    return requiredObject(Ctor as any)
  }

  if (Ctor?.prototype instanceof StructType) {
    return requiredStruct(Ctor as any)
  }

  throw new Error(`Unknown Schema Constructor: ${Ctor}`)
}
