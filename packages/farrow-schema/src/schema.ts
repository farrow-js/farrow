import { isBooleanConstructor, isNumberConstructor, isStringConstructor, isDateConstructor } from './utils'
import type { DateInstanceType, MarkReadOnlyDeep } from './types'

export type ShallowPrettier<T> = T extends object | any[]
  ? {
    [key in keyof T]: T[key]
  }
  : T

export abstract class Schema {
  static create<T extends SchemaCtor>(this: T, value: TypeOf<T>) {
    return value
  }
  static displayName?: string
  abstract __type: unknown
}

export type Primitives = NumberConstructor | StringConstructor | BooleanConstructor | DateConstructor

export type SchemaCtor<T extends Schema = Schema> = Primitives | (new () => T)

export type TypeOf<T extends SchemaCtor | Schema> = T extends DateConstructor
  ? DateInstanceType
  : T extends Primitives
  ? ReturnType<T>
  : T extends new () => { __type: infer U }
  ? U
  : T extends Schema
  ? T['__type']
  : never

export class Number extends Schema {
  __type!: number
}

export class String extends Schema {
  __type!: string
}

export class Boolean extends Schema {
  __type!: boolean
}

export class ID extends Schema {
  __type!: string
}

export class Int extends Schema {
  __type!: number
}

export class Float extends Schema {
  __type!: number
}

export class Date extends Schema {
  __type!: DateInstanceType
}

export abstract class ListType extends Schema {
  __type!: TypeOf<this['Item']>[]

  abstract Item: SchemaCtor
}

export const List = <T extends SchemaCtorInput>(Item: T) => {
  return class List extends ListType {
    Item = toSchemaCtor(Item)
  }
}

export type SchemaField<T extends object, key extends keyof T> = key extends '__type'
  ? never
  : T[key] extends undefined
  ? never
  : T[key] extends SchemaCtorInput | FieldInfo | undefined
  ? key
  : never

export type TypeOfField<T> = T extends FieldInfo
  ? TypeOf<T['__type']>
  : T extends SchemaCtorInput
  ? TypeOfSchemaCtorInput<T>
  : T extends undefined
  ? undefined
  : never

export abstract class ObjectType extends Schema {
  __type!: {
    [key in keyof this as SchemaField<this, key>]: TypeOfField<this[key]>
  }
}

export abstract class UnionType extends Schema {
  __type!: TypeOf<this['Items'][number]>
  abstract Items: SchemaCtor[]
}

export const Union = <T extends SchemaCtorInput[]>(...Items: T) => {
  return class Union extends UnionType {
    Items = toSchemaCtors(Items)
  }
}

export type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never

export type TypeOfIntersect<T extends SchemaCtor[]> = UnionToIntersection<TypeOf<T[number]>>

export abstract class IntersectType extends Schema {
  __type!: TypeOfIntersect<this['Items']>
  abstract Items: SchemaCtor[]
}

export const Intersect = <T extends SchemaCtorInput[]>(...Items: T) => {
  return class Intersect extends IntersectType {
    Items = toSchemaCtors(Items)
  }
}

export type Literals = number | string | boolean | null | undefined

export abstract class LiteralType extends Schema {
  __type!: this['value']
  abstract value: Literals
}

export const Literal = <T extends Literals>(value: T) => {
  return class Literal extends LiteralType {
    value = value
  }
}

export const Null = Literal(null)

export const Undefined = Literal(undefined)

export abstract class NullableType extends Schema {
  __type!: TypeOf<this['Item']> | null | undefined
  abstract Item: SchemaCtor
}

export const isNullableType = (input: any): input is new () => NullableType => {
  return input?.prototype instanceof NullableType
}

export const Nullable = <T extends SchemaCtorInput>(Item: T) => {
  return class Nullable extends NullableType {
    Item = toSchemaCtor(Item)
  }
}

export const Type = '__type' as const

export type FieldInfo = {
  __type: SchemaCtor
  description?: string
  deprecated?: string
}

export type FieldDescriptor = SchemaCtor | FieldInfo

export type FieldDescriptors = {
  [key: string]: FieldDescriptor | FieldDescriptors
}

export type TypeOfFieldDescriptor<T extends FieldDescriptor> = T extends SchemaCtor
  ? TypeOf<T>
  : T extends FieldInfo
  ? TypeOf<T['__type']>
  : never

export type TypeOfFieldDescriptors<T extends FieldDescriptors> = {
  [key in keyof T]: T[key] extends FieldDescriptor
  ? TypeOfFieldDescriptor<T[key]>
  : T[key] extends FieldDescriptors
  ? ShallowPrettier<TypeOfFieldDescriptors<T[key]>>
  : never
}

export abstract class StructType extends Schema {
  __type!: ShallowPrettier<TypeOfFieldDescriptors<this['descriptors']>>
  abstract descriptors: FieldDescriptors
}

export const Struct = <T extends FieldDescriptors>(descriptors: T) => {
  return class Struct extends StructType {
    descriptors = descriptors
  }
}

export type TypeOfRecord<T extends SchemaCtor> = {
  [key: string]: TypeOf<T>
}

export abstract class RecordType extends Schema {
  __type!: TypeOfRecord<this['Item']>
  abstract Item: SchemaCtor
}

export const Record = <T extends SchemaCtorInput>(Item: T) => {
  return class Record extends RecordType {
    Item = toSchemaCtor(Item)
  }
}

export class Any extends Schema {
  __type!: any
}

export class Unknown extends Schema {
  __type!: unknown
}
export class Never extends Schema {
  __type!: never
}

export type JsonType =
  | number
  | string
  | boolean
  | null
  | undefined
  | JsonType[]
  | {
    toJSON(): string
  }
  | {
    [key: string]: JsonType
  }

export class Json extends Schema {
  __type!: JsonType
}

export abstract class StrictType extends Schema {
  __type!: TypeOf<this['Item']>
  abstract Item: SchemaCtor
}

export const Strict = <T extends SchemaCtorInput>(Item: T) => {
  return class Strict extends StrictType {
    Item = toSchemaCtor(Item)
  }
}

export abstract class NonStrictType extends Schema {
  __type!: TypeOf<this['Item']>
  abstract Item: SchemaCtor
}

export const NonStrict = <T extends SchemaCtorInput>(Item: T) => {
  return class Strict extends NonStrictType {
    Item = toSchemaCtor(Item)
  }
}

export abstract class ReadOnlyType extends Schema {
  __type!: Readonly<TypeOf<this['Item']>>
  abstract Item: SchemaCtor
}

export const ReadOnly = <T extends SchemaCtorInput>(Item: T) => {
  return class ReadOnly extends ReadOnlyType {
    Item = toSchemaCtor(Item)
  }
}

export abstract class ReadOnlyDeepType extends Schema {
  __type!: MarkReadOnlyDeep<TypeOf<this['Item']>>
  abstract Item: SchemaCtor
}

export const ReadOnlyDeep = <T extends SchemaCtorInput>(Item: T) => {
  return class Strict extends ReadOnlyDeepType {
    Item = toSchemaCtor(Item)
  }
}

/* eslint-disable */
export type SchemaTypeOf<T extends SchemaCtor> = T extends NumberConstructor
  ? Number
  : T extends StringConstructor
  ? String
  : T extends BooleanConstructor
  ? Boolean
  : T extends DateConstructor
  ? Date
  : T extends new () => infer S
  ? S
  : never
/* eslint-enable */

export const getSchemaCtor = <T extends SchemaCtor>(Ctor: T): SchemaTypeOf<T> => {
  if (isNumberConstructor(Ctor)) {
    return Number as SchemaTypeOf<T>
  }

  if (isStringConstructor(Ctor)) {
    return String as SchemaTypeOf<T>
  }

  if (isBooleanConstructor(Ctor)) {
    return Boolean as SchemaTypeOf<T>
  }

  if (isDateConstructor(Ctor)) {
    return Date as SchemaTypeOf<T>
  }

  return Ctor as SchemaTypeOf<T>
}

export const isSchemaCtor = (input: any): input is SchemaCtor => {
  if (
    isNumberConstructor(input) ||
    isStringConstructor(input) ||
    isBooleanConstructor(input) ||
    isDateConstructor(input)
  ) {
    return true
  }

  return input?.prototype instanceof Schema
}

export const isFieldDescriptor = (input: any): input is FieldDescriptor => {
  return isSchemaCtor(input?.[Type] ?? input)
}

export const isFieldDescriptors = (input: any): input is FieldDescriptors => {
  return !!(input && typeof input === 'object')
}

export type SchemaCtorInput = SchemaCtor | FieldDescriptors

export type TypeOfSchemaCtorInput<T extends SchemaCtor | FieldDescriptors> = T extends SchemaCtor
  ? TypeOf<T>
  : T extends FieldDescriptors
  ? ShallowPrettier<TypeOfFieldDescriptors<T>>
  : never

export type ToSchemaCtor<T extends SchemaCtorInput> = T extends SchemaCtor
  ? T
  : T extends FieldDescriptors
  ? new () => { __type: ShallowPrettier<TypeOfFieldDescriptors<T>> }
  : never

export type SchemaCtorInputs =
  | SchemaCtorInput[]
  | {
    [key: string]: SchemaCtorInput
  }

export type ToSchemaCtors<T extends SchemaCtorInputs> = {
  [key in keyof T]: T[key] extends SchemaCtorInput ? ToSchemaCtor<T[key]> : never
}

export const toSchemaCtor = <T extends SchemaCtorInput>(Item: T) => {
  if (isSchemaCtor(Item)) {
    return Item as ToSchemaCtor<T>
  }
  return Struct(Item as FieldDescriptors) as unknown as ToSchemaCtor<T>
}

export const toSchemaCtors = <T extends SchemaCtorInputs>(Inputs: T): ToSchemaCtors<T> => {
  if (Array.isArray(Inputs)) {
    // @ts-ignore: ignore
    return Inputs.map(toSchemaCtor)
  }

  if (Inputs && typeof Inputs === 'object') {
    const result = {} as ToSchemaCtors<T>

    for (const key in Inputs) {
      // @ts-ignore: ignore
      result[key] = toSchemaCtor(Inputs[key])
    }

    return result
  }

  throw new Error(`Unknown inputs: ${Inputs}`)
}

/* eslint-enable */
export type InstanceTypeOf<T extends SchemaCtor> = T extends NumberConstructor
  ? number
  : T extends StringConstructor
  ? string
  : T extends BooleanConstructor
  ? boolean
  : T extends DateConstructor
  ? Date
  : T extends new () => infer R
  ? R
  : never
/* eslint-enable */

const instanceWeakMap = new WeakMap<SchemaCtor, Schema>()

export const getInstance = <T extends SchemaCtor>(Ctor: T): InstanceTypeOf<T> => {
  if (isNumberConstructor(Ctor)) {
    return getInstance(Number) as InstanceTypeOf<T>
  }

  if (isStringConstructor(Ctor)) {
    return getInstance(String) as InstanceTypeOf<T>
  }

  if (isBooleanConstructor(Ctor)) {
    return getInstance(Boolean) as InstanceTypeOf<T>
  }

  if (isDateConstructor(Ctor)) {
    return getInstance(Date) as InstanceTypeOf<T>
  }

  if (instanceWeakMap.has(Ctor)) {
    return instanceWeakMap.get(Ctor)! as InstanceTypeOf<T>
  }

  const instance = new Ctor()

  instanceWeakMap.set(Ctor, instance as Schema)

  return instance as InstanceTypeOf<T>
}

export type TypeOfTuple<T> = T extends []
  ? []
  : T extends [SchemaCtor, ...infer Rest]
  ? [TypeOf<T[0]>, ...TypeOfTuple<Rest>]
  : []

export abstract class TupleType extends Schema {
  __type!: TypeOfTuple<this['Items']>
  abstract Items: SchemaCtor[]
}

export const Tuple = <T extends SchemaCtorInput[]>(...Items: T) => {
  return class Tuple extends TupleType {
    Items = toSchemaCtors(Items)
  }
}
