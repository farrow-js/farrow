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

export const Type = Symbol('type')

export type Type = typeof Type

export type FieldDescriptor = SchemaCtor | { [Type]: SchemaCtor }

export const isFieldDescriptor = (input: any): input is FieldDescriptor => {
  let TargetSchema = input?.[Type] ?? input

  if (isNumberConstructor(TargetSchema) || isStringConstructor(TargetSchema) || isBooleanConstructor(TargetSchema)) {
    return true
  }

  return TargetSchema?.prototype instanceof Schema
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

export abstract class ListType<T extends SchemaCtor = SchemaCtor> extends Schema<TypeOfList<T>> {
  [Kind] = kind('List')
  abstract Item: T
}

export const List = <T extends SchemaCtor>(Item: T) => {
  return class List extends ListType<T> {
    Item = Item
  }
}

type TypeofUnion<T extends SchemaCtor[]> = TypeOfSchemaCtor<T[number]>

export abstract class UnionType<T extends SchemaCtor[] = SchemaCtor[]> extends Schema<TypeofUnion<T>> {
  [Kind] = kind('Union')
  abstract Items: T
}

export const Union = <T extends SchemaCtor[]>(...Items: T) => {
  return class Union extends UnionType<T> {
    Items = Items
  }
}

type TypeOfIntersect<T extends SchemaCtor[]> = T extends [SchemaCtor]
  ? TypeOfSchemaCtor<T[0]>
  : T extends [SchemaCtor, ...infer R]
  ? R extends SchemaCtor[]
    ? TypeOfSchemaCtor<T[0]> & TypeOfIntersect<R>
    : never
  : never

export abstract class IntersectType<T extends SchemaCtor[] = SchemaCtor[]> extends Schema<TypeOfIntersect<T>> {
  [Kind] = kind('Intersect')
  abstract Items: T
}

export const Intersect = <T extends SchemaCtor[]>(...items: T) => {
  return class Intersect extends IntersectType<T> {
    Items = items
  }
}

export abstract class NullableType<T extends SchemaCtor = SchemaCtor> extends Schema<
  TypeOfSchemaCtor<T> | null | undefined
> {
  [Kind] = kind('Nullable')
  abstract Item: T
}

export const Nullable = <T extends SchemaCtor>(item: T) => {
  return class Nullable extends NullableType<T> {
    Item = item
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

export abstract class RecordType<T extends SchemaCtor = SchemaCtor> extends Schema<TypeOfRecord<T>> {
  [Kind] = kind('Record')
  abstract Item: T
}

export const Record = <T extends SchemaCtor>(Item: T) => {
  return class Record extends RecordType<T> {
    Item = Item
  }
}

export type JsonType =
  | number
  | string
  | boolean
  | null
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


class User extends ObjectType {
  id = ID
  name = String
  orders = List(Order)
}

class Order extends ObjectType {
  id = ID
  product = Product
  user = User
}

class Product extends ObjectType {
  id = ID
  title = String
  description = String
  price = Float
}

class Query extends ObjectType {
  descriptors = {
    a: Boolean,
    b: Struct({
      c: {
        d: List(Nullable(String)),
      },
    }),
  }

  struct = Struct({
    a: Number,
    b: String,
    c: {
      deep: {
        d: List(Boolean),
      },
    },
  })

  nullable = Nullable(List(Number))

  union = Union(List(Number), List(String), List(Boolean))

  intersect = Intersect(Struct({ a: String }), Struct({ b: Boolean }))

  record = Record(Product)

  literal = Literal(12)

  json = Json

  any = Any

  getUser = User
  getOrder = Order
  getProduct = {
    [Type]: Product,
  }
}

type T0 = TypeOf<typeof Query>

type T1 = TypeOf<User>

type T2 = TypeOf<Product>
