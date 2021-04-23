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
  let instance = getInstance(Ctor)
  let descriptors = {} as FieldDescriptors

  for (let key in instance.descriptors) {
    if (keys.includes(key as keyof T['descriptors'])) {
      let value = instance.descriptors[key]
      descriptors[key] = value
    }
  }

  return Struct(descriptors as Pick<T['descriptors'], Keys[number]>)
}

export const omitStruct = <T extends StructType, Keys extends (keyof T['descriptors'])[]>(
  Ctor: new () => T,
  keys: Keys,
) => {
  let instance = getInstance(Ctor)
  let descriptors = {} as FieldDescriptors

  for (let key in instance.descriptors) {
    if (!keys.includes(key as keyof T['descriptors'])) {
      let value = instance.descriptors[key]
      descriptors[key] = value
    }
  }

  return Struct(descriptors as Omit<T['descriptors'], Keys[number]>)
}

export type PickObject<T extends ObjectType, Keys extends SchemaField<T, keyof T>> = {
  [key in keyof T as key extends Keys ? key : never]: T[key] extends FieldDescriptor ? T[key] : never
}

export const pickObject = <T extends ObjectType, Keys extends SchemaField<T, keyof T>[]>(
  Ctor: new () => T,
  keys: Keys,
) => {
  let instance = getInstance(Ctor)
  let descriptors = {} as FieldDescriptors

  if (instance instanceof ObjectType) {
    for (let key of Object.keys(instance)) {
      if (keys.includes(key as any)) {
        let value = instance[key]
        if (isFieldDescriptor(value)) {
          descriptors[key] = value
        } else if (isFieldDescriptors(value)) {
          descriptors[key] = value
        }
      }
    }
  }

  return Struct(descriptors as PickObject<T, Keys[number]>)
}

export type OmitObject<T extends ObjectType, Keys extends SchemaField<T, keyof T>> = {
  [key in keyof T as key extends Keys | '__type' ? never : key]: T[key] extends FieldDescriptor ? T[key] : never
}

export const omitObject = <T extends ObjectType, Keys extends SchemaField<T, keyof T>[]>(
  Ctor: new () => T,
  keys: Keys,
) => {
  let instance = getInstance(Ctor)
  let descriptors = {} as FieldDescriptors

  if (instance instanceof ObjectType) {
    for (let key of Object.keys(instance)) {
      if (!keys.includes(key as any)) {
        let value = instance[key]
        if (isFieldDescriptor(value)) {
          descriptors[key] = value
        } else if (isFieldDescriptors(value)) {
          descriptors[key] = value
        }
      }
    }
  }

  return Struct(descriptors as OmitObject<T, Keys[number]>)
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
}) as PickSchema

export const keyofStruct = <T extends StructType>(Ctor: new () => T): (keyof T['descriptors'])[] => {
  return Object.keys(getInstance(Ctor).descriptors)
}

export const keyofObject = <T extends ObjectType>(Ctor: new () => T): (keyof TypeOf<T>)[] => {
  let instance = getInstance(Ctor)
  let keys = [] as (keyof TypeOf<T>)[]

  for (let key of Object.keys(instance)) {
    let value = instance[key]
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
  let fields = {} as SchemaCtorFields

  for (let [key, field] of Object.entries(descriptors)) {
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

const isNullableType = (input: any): input is new () => S.NullableType => {
  return input?.prototype instanceof S.NullableType
}

const getPartialFields = (fields: FieldDescriptors) => {
  let descriptors = {} as S.FieldDescriptors

  for (let [key, value] of Object.entries(getSchemaCtorFields(fields))) {
    descriptors[key] = {
      ...value,
      [S.Type]: isNullableType(value[S.Type]) ? value[S.Type] : S.Nullable(value[S.Type]),
    }
  }

  return descriptors
}

export const partialStruct = <T extends StructType>(Ctor: new () => T) => {
  let instance = getInstance(Ctor)

  return class partial extends PartialType {
    Item = (S.Struct(getPartialFields(instance.descriptors)) as unknown) as typeof Ctor
  }
}

export const partialObject = <T extends ObjectType>(Ctor: new () => T) => {
  let instance = getInstance(Ctor)

  return class partial extends PartialType {
    Item = (S.Struct(getPartialFields((instance as unknown) as S.FieldDescriptors)) as unknown) as typeof Ctor
  }
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
