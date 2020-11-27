import { isNumberConstructor, isStringConstructor, isBooleanConstructor } from './utils'

export type Prettier<T> = T extends object | any[]
  ? {
      [key in keyof T]: Prettier<T[key]>
    }
  : T

export type Primitives = NumberConstructor | StringConstructor | BooleanConstructor

export const Kind = Symbol('kind')

export type Kind = typeof Kind

const Phantom = Symbol('phantom')

type Phantom = typeof Phantom

export abstract class Schema<T = unknown> {
  abstract [Kind]: string
  [Phantom]: T | Phantom = Phantom
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

export type FieldDescriptor = SchemaCtor | { [Type]: SchemaCtor }

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
    // @ts-ignore
    return Inputs.map(toSchemaCtor)
  }

  if (Inputs && typeof Inputs === 'object') {
    let result = {} as ToSchemaCtors<T>

    for (let key in Inputs) {
      // @ts-ignore
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

type TypeOfObjectType<T extends ObjectType> = {
  [key in keyof T as T[key] extends FieldDescriptor | FieldDescriptors ? key : never]:
    T[key] extends FieldDescriptor ? TypeOfFieldDescriptor<T[key]> :
    T[key] extends FieldDescriptors ? TypeOfFieldDescriptors<T[key]> :
    never
}

export const kind = <T extends string>(name: T) => name

export class ObjectType extends Schema<unknown> {
  [Kind] = kind('Object')
}

export class Number extends Schema<number> {
  [Kind] = kind('Number')
}

export class String extends Schema<string> {
  [Kind] = kind('String')
}

export class Boolean extends Schema<boolean> {
  [Kind] = kind('Boolean')
}

export class Int extends Schema<number> {
  [Kind] = kind('Int')
}

export class Float extends Schema<number> {
  [Kind] = kind('Float')
}

export class ID extends Schema<string> {
  [Kind] = kind('ID')
}

type TypeOfStruct<T extends FieldDescriptors> = TypeOfFieldDescriptors<T>

export abstract class StructType<T extends FieldDescriptors = FieldDescriptors> extends Schema<TypeOfStruct<T>> {
  [Kind] = kind('Struct')
  abstract descriptors: T
}

export const Struct = <T extends FieldDescriptors>(descriptors: T) => {
  return class Struct extends StructType<T> {
    descriptors = descriptors
  }
}

type TypeOfList<T extends SchemaCtor> = Array<TypeOfSchemaCtor<T>>

export abstract class ListType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<
  TypeOfList<ToSchemaCtor<T>>
> {
  [Kind] = kind('List')
  abstract Item: ToSchemaCtor<T>
}

export const List = <T extends SchemaCtorInput>(Item: T) => {
  return class List extends ListType<T> {
    Item = toSchemaCtor(Item)
  }
}

type TypeofUnion<T extends SchemaCtor[]> = TypeOfSchemaCtor<T[number]>

export abstract class UnionType<T extends SchemaCtorInput[] = SchemaCtorInput[]> extends Schema<TypeofUnion<ToSchemaCtors<T>>> {
  [Kind] = kind('Union')
  abstract Items: ToSchemaCtors<T>
}

export const Union = <T extends SchemaCtorInput[]>(...Items: T) => {
  return class Union extends UnionType<T> {
    Items = toSchemaCtors(Items)
  }
}

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never

type TypeOfIntersect<T extends SchemaCtor[]> = UnionToIntersection<TypeOf<T[number]>>

export abstract class IntersectType<T extends SchemaCtorInput[] = SchemaCtorInput[]> extends Schema<TypeOfIntersect<ToSchemaCtors<T>>> {
  [Kind] = kind('Intersect')
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
  [Kind] = kind('Nullable')
  abstract Item: ToSchemaCtor<T>
}

export function Nullable<T extends SchemaCtorInput>(Item: T) {
  return class Nullable extends NullableType<T> {
    Item = toSchemaCtor(Item)
  }
}

export type Literals = number | string | boolean | null

export abstract class LiteralType<T extends Literals = Literals> extends Schema<T> {
  [Kind] = kind('Literal')
  abstract value: T
}

export const Literal = <T extends Literals>(value: T) => {
  return class Literal extends LiteralType<T> {
    value = value
  }
}

type TypeOfRecord<T extends SchemaCtor> = {
  [key: string]: TypeOfSchemaCtor<T>
}

export abstract class RecordType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<TypeOfRecord<ToSchemaCtor<T>>> {
  [Kind] = kind('Record')
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
      [key: string]: JsonType
    }

export class Json extends Schema<JsonType> {
  [Kind] = kind('Json')
}

export class Any extends Schema<any> {
  [Kind] = kind('Any')
}

export abstract class StrictType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<TypeOf<ToSchemaCtor<T>>> {
  [Kind] = kind('Strict')
  abstract Item: ToSchemaCtor<T>
}

export const Strict = <T extends SchemaCtorInput>(Item: T) => {
  return class Strict extends StrictType<T> {
    Item = toSchemaCtor(Item)
  }
}

export abstract class NonStrictType<T extends SchemaCtorInput = SchemaCtorInput> extends Schema<TypeOf<ToSchemaCtor<T>>> {
  [Kind] = kind('Strict')
  abstract Item: ToSchemaCtor<T>
}

export const NonStrict = <T extends SchemaCtorInput>(Item: T) => {
  return class NonStrict extends NonStrictType<T> {
    Item = toSchemaCtor(Item)
  }
}

// class User extends ObjectType {
//   id = ID
//   name = String
//   orders = List(Order)
// }

// class Order extends ObjectType {
//   id = ID
//   product = Product
//   user = User
// }

// class Product extends ObjectType {
//   id = ID
//   title = String
//   description = String
//   price = Float
// }

// class Query extends ObjectType {
//   descriptors = {
//     a: Boolean,
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
//   getProduct = {
//     [Type]: Product,
//   }
// }

// type T0 = TypeOf<typeof Query>

// type T1 = TypeOf<User>

// type T2 = TypeOf<Product>
