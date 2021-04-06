/**
 * Idea:
 * - We don't need to carry type in generic type position
 * - We can keep it in class fields, such like __type
 * - Using this-type to access the instance-type
 * - Perform some type-level programming to infer the type of Schema
 */

import { MarkReadOnlyDeep } from '../types'
import { isBooleanConstructor, isNumberConstructor, isStringConstructor } from '../utils'

export type ShallowPrettier<T> = T extends object | any[]
  ? {
      [key in keyof T]: T[key]
    }
  : T

export abstract class Schema {
  static new<T extends SchemaCtor>(this: T, value: TypeOf<T>) {
    return value
  }
  abstract __type: unknown
}

export type Primitives = NumberConstructor | StringConstructor | BooleanConstructor

export type SchemaCtor<T extends Schema = Schema> = Primitives | (new () => T)

export type TypeOf<T extends SchemaCtor | Schema> = T extends Primitives
  ? ReturnType<T>
  : T extends new () => { __type: infer U }
  ? U
  : T extends Schema
  ? T['__type']
  : never

export class NumberType extends Schema {
  __type!: number
}

export const Number = NumberType

export class StringType extends Schema {
  __type!: string
}

export const String = StringType

export class BooleanType extends Schema {
  __type!: boolean
}

export const Boolean = BooleanType

export class IDType extends Schema {
  __type!: string
}

export const ID = IDType

export class IntType extends Schema {
  __type!: number
}

export const Int = IntType

export class FloatType extends Schema {
  __type!: number
}

export const Float = FloatType

export abstract class ListType extends Schema {
  __type!: TypeOf<this['Item']>[]

  abstract Item: SchemaCtor
}

export const List = <T extends SchemaCtor>(Item: T) => {
  return class List extends ListType {
    Item = Item
  }
}

export type SchemaField<T extends object, key extends keyof T> = T[key] extends undefined
  ? never
  : T[key] extends SchemaCtor | undefined
  ? key
  : never

export type TypeOfField<T> = T extends SchemaCtor ? TypeOf<T> : T extends undefined ? undefined : never

export abstract class ObjectType extends Schema {
  __type!: {
    [key in keyof this as SchemaField<this, key>]: TypeOfField<this[key]>
  }
}

export abstract class UnionType extends Schema {
  __type!: TypeOf<this['Items'][number]>
  abstract Items: SchemaCtor[]
}

export const Union = <T extends SchemaCtor[]>(...Items: T) => {
  return class Union extends UnionType {
    Items = Items
  }
}

export type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never

export type TypeOfIntersect<T extends SchemaCtor[]> = UnionToIntersection<TypeOf<T[number]>>

export abstract class IntersectType extends Schema {
  __type!: TypeOfIntersect<this['Items']>
  abstract Items: SchemaCtor[]
}

export const Intersect = <T extends SchemaCtor[]>(...Items: T) => {
  return class Intersect extends IntersectType {
    Items = Items
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

export const Nullable = <T extends SchemaCtor>(Ctor: T) => {
  return Union(Ctor, Null, Undefined)
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

export type TypeOfFieldDescriptors<T extends FieldDescriptors> = ShallowPrettier<
  {
    [key in keyof T]: T[key] extends FieldDescriptor
      ? TypeOfFieldDescriptor<T[key]>
      : T[key] extends FieldDescriptors
      ? TypeOfFieldDescriptors<T[key]>
      : never
  }
>

export abstract class StructType extends Schema {
  __type!: TypeOfFieldDescriptors<this['descriptors']>
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

export const Record = <T extends SchemaCtor>(Item: T) => {
  return class Record extends RecordType {
    Item = Item
  }
}

export class AnyType extends Schema {
  __type!: any
}

export const Any = AnyType

export class UnknownType extends Schema {
  __type!: unknown
}

export const Unknown = UnknownType

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

export const Strict = <T extends SchemaCtor>(Item: T) => {
  return class Strict extends StrictType {
    Item = Item
  }
}

export abstract class NonStrictType extends Schema {
  __type!: TypeOf<this['Item']>
  abstract Item: SchemaCtor
}

export const NonStrict = <T extends SchemaCtor>(Item: T) => {
  return class Strict extends NonStrictType {
    Item = Item
  }
}

export abstract class ReadOnlyType extends Schema {
  __type!: Readonly<TypeOf<this['Item']>>
  abstract Item: SchemaCtor
}

export const ReadOnly = <T extends SchemaCtor>(Item: T) => {
  return class ReadOnly extends ReadOnlyType {
    Item = Item
  }
}

export abstract class ReadOnlyDeepType extends Schema {
  __type!: MarkReadOnlyDeep<TypeOf<this['Item']>>
  abstract Item: SchemaCtor
}

export const ReadOnlyDeep = <T extends SchemaCtor>(Item: T) => {
  return class Strict extends ReadOnlyDeepType {
    Item = Item
  }
}

export type SchemaTypeOf<T extends SchemaCtor> = T extends NumberConstructor
  ? NumberType
  : T extends StringConstructor
  ? StringType
  : T extends BooleanConstructor
  ? BooleanType
  : T extends new () => infer S
  ? S
  : never

export const getSchemaCtor = <T extends SchemaCtor>(Ctor: T): SchemaTypeOf<T> => {
  if (isNumberConstructor(Ctor)) {
    return NumberType as SchemaTypeOf<T>
  }

  if (isStringConstructor(Ctor)) {
    return StringType as SchemaTypeOf<T>
  }

  if (isBooleanConstructor(Ctor)) {
    return BooleanType as SchemaTypeOf<T>
  }

  return Ctor as SchemaTypeOf<T>
}

export const isSchemaCtor = (input: any): input is SchemaCtor => {
  if (isNumberConstructor(input) || isStringConstructor(input) || isBooleanConstructor(input)) {
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
