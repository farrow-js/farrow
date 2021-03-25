import { isNumberConstructor, isStringConstructor, isBooleanConstructor } from './utils'
import { MarkReadOnlyDeep } from './types'

export type Prettier<T> = T extends Promise<infer U>
  ? Promise<Prettier<U>>
  : T extends (...args: infer Args) => infer Return
  ? (...args: Prettier<Args>) => Prettier<Return>
  : T extends object | any[]
  ? {
      [key in keyof T]: Prettier<T[key]>
    }
  : T

export type Primitives = NumberConstructor | StringConstructor | BooleanConstructor

export const Phantom = Symbol('phantom')

export type Phantom = typeof Phantom

export abstract class Schema<T = unknown> {
  abstract readonly __kind: string
  readonly __phantom: T | Phantom = Phantom
}

export type SchemaCtor = Primitives | (new () => Schema)

export const isSchemaCtor = (input: any): input is SchemaCtor => {
  if (isNumberConstructor(input) || isStringConstructor(input) || isBooleanConstructor(input)) {
    return true
  }

  return input?.prototype instanceof Schema
}

export const Type = Symbol('type')

export type Type = typeof Type

export type FieldInfo = {
  [Type]: SchemaCtor
  description?: string
  deprecated?: string
}

export type FieldDescriptor = SchemaCtor | FieldInfo

export const field = <T extends FieldInfo>(fieldInfo: T): T => {
  return fieldInfo
}

export const isFieldDescriptor = (input: any): input is FieldDescriptor => {
  return isSchemaCtor(input?.[Type] ?? input)
}

export type FieldDescriptors = {
  [key: string]: FieldDescriptor | FieldDescriptors
}

export const isFieldDescriptors = (input: any): input is FieldDescriptors => {
  return !!(input && typeof input === 'object')
}

export type TypeOfFieldDescriptor<T extends FieldDescriptor> = T extends SchemaCtor
  ? TypeOfSchemaCtor<T>
  : T extends { [Type]: SchemaCtor }
  ? TypeOfSchemaCtor<T[Type]>
  : never

export type TypeOfFieldDescriptors<T extends FieldDescriptors> = {
  [key in keyof T]: T[key] extends FieldDescriptor
    ? TypeOfFieldDescriptor<T[key]>
    : T[key] extends FieldDescriptors
    ? TypeOfFieldDescriptors<T[key]>
    : never
}

export type SchemaCtorInput = SchemaCtor | FieldDescriptors

export type ToSchemaCtor<T extends SchemaCtorInput> = T extends SchemaCtor
  ? T
  : T extends FieldDescriptors
  ? new () => StructType<T>
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
  return Struct(Item as FieldDescriptors) as ToSchemaCtor<T>
}

export const toSchemaCtors = <T extends SchemaCtorInputs>(Inputs: T): ToSchemaCtors<T> => {
  if (Array.isArray(Inputs)) {
    // @ts-ignore: ignore
    return Inputs.map(toSchemaCtor)
  }

  if (Inputs && typeof Inputs === 'object') {
    let result = {} as ToSchemaCtors<T>

    for (let key in Inputs) {
      // @ts-ignore: ignore
      result[key] = toSchemaCtor(Inputs[key])
    }

    return result
  }

  throw new Error(`Unknown inputs: ${Inputs}`)
}

export type TypeOfSchemaCtor<T extends SchemaCtor> = T extends Primitives
  ? ReturnType<T>
  : InstanceType<T> extends ObjectType
  ? TypeOfObjectType<InstanceType<T>>
  : T extends new () => Schema<infer U>
  ? U
  : never

export type TypeOf<T extends Schema | SchemaCtor> = T extends Schema
  ? TypeOfSchemaCtor<new () => T>
  : T extends SchemaCtor
  ? TypeOfSchemaCtor<T>
  : never

export type TypeOfObjectType<T extends ObjectType> = {
  [key in keyof T as T[key] extends FieldDescriptor | FieldDescriptors ? key : never]: T[key] extends FieldDescriptor
    ? TypeOfFieldDescriptor<T[key]>
    : T[key] extends FieldDescriptors
    ? TypeOfFieldDescriptors<T[key]>
    : never
}

export const kind = <T extends string>(name: T) => name

const Scalar = Symbol('Scalar')

type Scalar = typeof Scalar

export abstract class ScalarType<T = unknown> extends Schema<T> {
  [Scalar] = true
}

export class Number extends ScalarType<number> {
  __kind = kind('Number')
}

export class String extends ScalarType<string> {
  __kind = kind('String')
}

export class Boolean extends ScalarType<boolean> {
  __kind = kind('Boolean')
}

export class Int extends ScalarType<number> {
  __kind = kind('Int')
}

export class Float extends ScalarType<number> {
  __kind = kind('Float')
}

export class ID extends ScalarType<string> {
  __kind = kind('ID')
}

export type TypeOfStruct<T extends FieldDescriptors> = TypeOfFieldDescriptors<T>

export abstract class StructType<T extends FieldDescriptors = FieldDescriptors> extends Schema<TypeOfStruct<T>> {
  __kind = kind('Struct')
  abstract descriptors: T
}

export const Struct = <T extends FieldDescriptors>(descriptors: T) => {
  return class Struct extends StructType<T> {
    descriptors = descriptors
  }
}

export abstract class ObjectType extends Schema<unknown> {
  __kind = kind('Object')
}

export type TypeOfList<T extends SchemaCtor> = TypeOfSchemaCtor<T>[]

export abstract class ListType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<
  TypeOfList<ToSchemaCtor<T>>
> {
  __kind = kind('List')
  abstract Item: ToSchemaCtor<T>
}

export const List = <T extends SchemaCtorInput>(Item: T) => {
  return class List extends ListType<T> {
    Item = toSchemaCtor(Item)
  }
}

export type TypeofUnion<T extends SchemaCtor[]> = TypeOfSchemaCtor<T[number]>

export abstract class UnionType<T extends SchemaCtorInput[] = SchemaCtorInput[]> extends Schema<
  TypeofUnion<ToSchemaCtors<T>>
> {
  __kind = kind('Union')
  abstract Items: ToSchemaCtors<T>
}

export const Union = <T extends SchemaCtorInput[]>(...Items: T) => {
  return class Union extends UnionType<T> {
    Items = toSchemaCtors(Items)
  }
}

export type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never

export type TypeOfIntersect<T extends SchemaCtor[]> = UnionToIntersection<TypeOf<T[number]>>

export abstract class IntersectType<T extends SchemaCtorInput[] = SchemaCtorInput[]> extends Schema<
  TypeOfIntersect<ToSchemaCtors<T>>
> {
  __kind = kind('Intersect')
  abstract Items: ToSchemaCtors<T>
}

export const Intersect = <T extends SchemaCtorInput[]>(...Items: T) => {
  return class Intersect extends IntersectType<T> {
    Items = toSchemaCtors(Items)
  }
}

export abstract class NullableType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<
  TypeOf<ToSchemaCtor<T>> | null | undefined
> {
  __kind = kind('Nullable')
  abstract Item: ToSchemaCtor<T>
}

export function Nullable<T extends SchemaCtorInput>(Item: T) {
  return class Nullable extends NullableType<T> {
    Item = toSchemaCtor(Item)
  }
}

export type Literals = number | string | boolean | null

export abstract class LiteralType<T extends Literals = Literals> extends Schema<T> {
  __kind = kind('Literal')
  abstract value: T
}

export const Literal = <T extends Literals>(value: T) => {
  return class Literal extends LiteralType<T> {
    value = value
  }
}

export type TypeOfRecord<T extends SchemaCtor> = {
  [key: string]: TypeOfSchemaCtor<T>
}

export abstract class RecordType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<
  TypeOfRecord<ToSchemaCtor<T>>
> {
  __kind = kind('Record')
  abstract Item: ToSchemaCtor<T>
}

export const Record = <T extends SchemaCtorInput>(Item: T) => {
  return class Record extends RecordType<T> {
    Item = toSchemaCtor(Item)
  }
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

export class Json extends Schema<JsonType> {
  __kind = kind('Json')
}

export class Any extends Schema<any> {
  __kind = kind('Any')
}

export class Unknown extends Schema<unknown> {
  __kind = kind('Unknown')
}

export abstract class StrictType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<TypeOf<ToSchemaCtor<T>>> {
  __kind = kind('Strict')
  abstract Item: ToSchemaCtor<T>
}

export const Strict = <T extends SchemaCtorInput>(Item: T) => {
  return class Strict extends StrictType<T> {
    Item = toSchemaCtor(Item)
  }
}

export abstract class NonStrictType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<
  TypeOf<ToSchemaCtor<T>>
> {
  __kind = kind('NonStrict')
  abstract Item: ToSchemaCtor<T>
}

export const NonStrict = <T extends SchemaCtorInput>(Item: T) => {
  return class NonStrict extends NonStrictType<T> {
    Item = toSchemaCtor(Item)
  }
}

export abstract class ReadOnlyType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<
  Readonly<TypeOf<ToSchemaCtor<T>>>
> {
  __kind = kind('ReadOnly')
  abstract Item: ToSchemaCtor<T>
}

export const ReadOnly = <T extends SchemaCtorInput>(Item: T) => {
  return class ReadOnly extends ReadOnlyType<T> {
    Item = toSchemaCtor(Item)
  }
}

export abstract class ReadOnlyDeepType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<
  MarkReadOnlyDeep<TypeOf<ToSchemaCtor<T>>>
> {
  __kind = kind('ReadOnlyDeep')
  abstract Item: ToSchemaCtor<T>
}

export const ReadOnlyDeep = <T extends SchemaCtorInput>(Item: T) => {
  return class DeepReadOnly extends ReadOnlyDeepType<T> {
    Item = toSchemaCtor(Item)
  }
}

// // define User Object, it supports recursive definition
// class User extends ObjectType {
//   id = ID
//   name = String
//   orders = List(Order) // order list type
// }

// // define Order Object
// class Order extends ObjectType {
//   id = ID
//   product = Product
//   user = User
// }

// // define Product Object
// class Product extends ObjectType {
//   id = ID
//   title = String
//   description = String
//   price = Float
// }

// // define AppState Object
// class AppState extends ObjectType {
//   descriptors = {
//     a: Boolean,
//     // a light way to construct struct type
//     b: Struct({
//       c: {
//         d: List(Nullable(String)),
//       },
//     }),
//   }

//   struct = Struct({
//     a: Number,
//     b: String,
//     c: {
//       deep: {
//         d: List(Boolean),
//       },
//     },
//   })

//   nullable = Nullable(List(Number))

//   union = Union(List(Number), List(String), List(Boolean))

//   intersect = Intersect(Struct({ a: String }), Struct({ b: Boolean }))

//   record = Record(Product)

//   literal = Literal(12)

//   json = Json

//   any = Any

//   getUser = User
//   getOrder = Order
//   // supports { [Type]: SchemaCtor }
//   getProduct = field({
//     [Type]: Product,
//     description: 'get product',
//   })
// }

// type T0 = TypeOf<AppState>

// type T1 = TypeOf<User>

// type T2 = TypeOf<Product>
