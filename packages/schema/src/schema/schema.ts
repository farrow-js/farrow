export type Primitives = NumberConstructor | StringConstructor | BooleanConstructor

export abstract class Schema {
  abstract __typename: string
}

export type SchemaCtor<T extends Schema = Schema> = new () => T

export type ValidSchema = 
  | Primitives 
  | Int 
  | Float 
  | ObjectType 
  | ListType 
  | UnionType 
  | IntersectType 
  | NullableType 
  | LiteralType 
  | RecordType 
  | Json 
  | Any

export type ValidSchemaCtor<T extends ValidSchema> = T extends Schema ? SchemaCtor<T> : T  

export type ValidSchemaCtors = ValidSchemaCtor<ValidSchema>

export type SchemaDescriptor = ValidSchemaCtors | { type: ValidSchemaCtors }

export const isSchemaDescriptor = (input: any): input is SchemaDescriptor => {
  let TargetSchema = input?.type ?? input

  if (TargetSchema === Number || TargetSchema === String || TargetSchema === Boolean) {
    return true
  }

  return TargetSchema?.prototype instanceof Schema
}

export const typename = <T extends string>(name: T) => name

export class Int extends Schema {
  __typename = typename('Int')
}

export class Float extends Schema {
  __typename = typename('Float')
}

export class ObjectType extends Schema {
  __typename = typename('Object')
}

export abstract class ListType<T = any> extends Schema {
  __typename = typename('List')
  abstract Item: T
}

export const List = <T extends ValidSchemaCtors>(Type: T) => {
  return class List extends ListType<T> {
    Item = Type
  }
}

export abstract class UnionType<T extends any[] = any[]> extends Schema {
  __typename = typename('Union')
  abstract Items:  T
}


export const Union = <T extends ValidSchemaCtors[]>(...items: T) => {
  return class Union extends UnionType<T> {
    Items = items
  }
}

export abstract class IntersectType<T extends any[] = any[]> extends Schema {
  __typename = typename('Intersect')
  abstract Items: T
}

export const Intersect = <T extends ValidSchemaCtors[]>(...items: T) => {
  return class Intersect extends IntersectType<T> {
    Items = items
  }
}

export abstract class NullableType<T = any> extends Schema {
  __typename = typename('Nullable')
  abstract Item: T
}

export const Nullable = <T extends ValidSchemaCtors>(item: T) => {
  return class Nullable extends NullableType<T> {
    Item = item
  }
}

export type Literals = number | string | boolean | null

export abstract class LiteralType<T extends Literals = Literals> extends Schema {
  __typename = typename('Literal')
  abstract value: T
}

export const Literal = <T extends Literals>(value: T) => {
  return class Literal extends LiteralType<T> {
    value = value
  }
}

export abstract class RecordType<T = any> extends Schema {
  __typename = typename('Record')
  abstract Item: T
  
}

export const Record = <T extends ValidSchemaCtors>(item: T) => {
  return class Record extends RecordType<T> {
    Item = item
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

export class Json extends Schema {
  __typename = typename('Json')
}

export class Any extends Schema {
  __typename = typename('Any')
}

type TypeOfUnionItem<T extends ValidSchemaCtors> = T extends ValidSchemaCtors ? TypeOf<T> : never

type TypeOfIntersect<T extends any[]> = 
  T extends [infer A] ? TypeOf<A> :
  T extends [infer A, ...infer B] ? B extends ValidSchemaCtors[] ? TypeOf<A> & TypeOfIntersect<B> : never :
  never

export type TypeOf<T> = 
  T extends SchemaCtor<infer U> ? TypeOf<U> :
  T extends { type: infer U } ? TypeOf<U> :
  T extends Primitives ? ReturnType<T> :
  T extends Int ? number :
  T extends Float ? number :
  T extends UnionType<infer U> ? TypeOfUnionItem<U[number]> :
  T extends IntersectType<infer U> ? TypeOfIntersect<U> :
  T extends NullableType<infer U> ? TypeOf<U> | null | undefined :
  T extends LiteralType<infer U> ? U :
  T extends RecordType<infer U> ? Record<string, TypeOf<U>> :
  T extends ListType<infer U> ? Array<TypeOf<U>> :
  T extends ObjectType ? {
    [key in keyof T as T[key] extends SchemaDescriptor ? key : never]: TypeOf<T[key]>
  } :
  T extends Json ? JsonType :
  T extends Any ? any :
  never

class A extends ObjectType {
  a = Number
}

class B extends ObjectType {
  b = String
}


class Detail extends ObjectType {
  a = Number
  b = List(String)
  c = Boolean
  d = {
    type: Number,
    description: 'abc'
  }
  e = {
    type: Union(Number, String)
  }
  f = {
    type: Intersect(A, B)
  }
  g = {
    type: Nullable(A)
  }
  h = Literal(1)
  i = Union(Literal(1), Literal('1'), Nullable(Literal(false)))
  j = Record(B)
  k = Json
  l = Any
  m = Detail
}

type T0 = TypeOf<Detail>
