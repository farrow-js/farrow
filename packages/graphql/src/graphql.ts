import type { ValueNode } from 'graphql'

const typenameMap = new WeakMap<TypeCtor, string>()

export const getTypename = <T extends Type>(GraphQLType: new () => T): T['name'] => {
  let typename = typenameMap.get(GraphQLType)
  if (!typename) {
    typename = new GraphQLType().name
    typenameMap.set(GraphQLType, typename)
  }
  return typename
}

export const resolve = <T extends ObjectType | UnionType, V extends Omit<ResolverTypeOf<T>, '__typename'>>(
  GraphQLType: new () => T,
  value: V,
) => {
  return {
    ...value,
    __typename: getTypename(GraphQLType),
  } as { __typename: T['name'] } & V
}

const Phantom = Symbol('phantom')

type Phantom = typeof Phantom

export abstract class Type<T = unknown> {
  [Phantom]: T | Phantom = Phantom
  abstract name: string
  description?: string
}

export type TypeCtor = new () => Type

export type Prettier<T> = T extends Promise<infer U>
  ? Promise<Prettier<U>>
  : T extends (...args: infer Args) => infer Return
  ? (...args: Prettier<Args>) => Prettier<Return>
  : T extends object | any[]
  ? {
      [key in keyof T]: Prettier<T[key]>
    }
  : T

// TypeOf
export type TypeOf<T> = T extends TypeCtor
  ? TypeOf<InstanceType<T>>
  : T extends ObjectType
  ? TypeOfObject<T>
  : T extends InputObjectType
  ? TypeOfInputObject<T>
  : T extends EnumType
  ? TypeOfEnum<T>
  : T extends UnionType
  ? TypeOfUnion<T>
  : T extends InterfaceType
  ? TypeOfFields<T['fields']>
  : T extends Type<infer U>
  ? U
  : never

export type DataObjectType<T> = {
  [key in keyof T as key extends '__typename' ? never : T[key] extends (...args: any) => any ? never : key]: T[key]
}

export type DataType<T> = TypeOf<T> extends { __typename?: string } ? DataObjectType<TypeOf<T>> : TypeOf<T>

export type TypeOfObject<T extends ObjectType> = T['interfaces'] extends any[]
  ? { __typename?: T['name'] } & TypeOfFields<T['fields']> & TypeOfInterfaces<T['interfaces']>
  : { __typename?: T['name'] } & TypeOfFields<T['fields']>

type TypeOfFields<T extends FieldConfigs> = {
  [key in keyof T]: T[key] extends FieldConfig ? TypeOfField<T[key]> : T[key] extends TypeCtor ? TypeOf<T[key]> : never
}

type TypeOfField<T extends FieldConfig> = T extends FunctionFieldConfig
  ? TypeOfFunctionField<T>
  : T extends ValueFieldConfig
  ? TypeOfValueField<T>
  : never

type TypeOfValueField<T extends ValueFieldConfig> = TypeOf<T['type']>

type TypeOfFunctionField<T extends FunctionFieldConfig> = (
  args: TypeOfArgumentConfigMap<T['args']>,
) => TypeOf<T['type']>

type TypeOfArgumentConfigMap<T extends ArgumentConfigMap> = {
  [key in keyof T]: TypeOf<T[key]['type']>
}

export type TypeOfInterface<T extends InterfaceType> = TypeOfFields<T['fields']>

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never

export type TypeOfInterfaces<T extends (new () => InterfaceType)[]> = UnionToIntersection<
  TypeOfInterface<InstanceType<T[number]>>
>

type TypeOfInputObject<T extends InputObjectType> = TypeOfInputFields<T['fields']>

type TypeOfInputFields<T extends InputFieldConfigs> = {
  [key in keyof T]: T[key] extends InputFieldConfig
    ? TypeOf<T[key]['type']>
    : T[key] extends TypeCtor
    ? TypeOf<T[key]>
    : never
}

type TypeOfEnum<T extends EnumType> = TypeOfEnumValue<T['values'][keyof T['values']]>

type TypeOfEnumValue<T extends EnumValueConfig> = T['value']

type TypeOfUnion<T extends UnionType> = TypeOf<T['types'][number]>

// ResolverTypeOf

type Optional<T> = T | null | undefined

// graphql field resolver can be thunk or async thunk
type ResolvedValue<T> = Optional<T> | (() => Optional<T>) | (() => Promise<Optional<T>>)

export type ResolverTypeOf<T> = T extends TypeCtor
  ? ResolverTypeOf<InstanceType<T>>
  : T extends ObjectType
  ? ResolverTypeOfObject<T>
  : T extends InputObjectType
  ? ResolverTypeOfInputObject<T>
  : T extends EnumType
  ? ResolverTypeOfEnum<T>
  : T extends UnionType
  ? ResolverTypeOfUnion<T>
  : T extends InterfaceType
  ? ResolverTypeOfFields<T['fields']>
  : T extends Type<infer U>
  ? U
  : never

export type ResolverTypeOfObject<T extends ObjectType> = T['interfaces'] extends any[]
  ? { __typename?: T['name'] } & ResolverTypeOfFields<T['fields']> & ResolverTypeOfInterfaces<T['interfaces']>
  : { __typename?: T['name'] } & ResolverTypeOfFields<T['fields']>

type ResolverTypeOfFields<T extends FieldConfigs> = {
  [key in keyof T]: T[key] extends FieldConfig
    ? ResolverTypeOfField<T[key]>
    : T[key] extends TypeCtor
    ? ResolverTypeOf<T[key]>
    : never
}

type ResolverTypeOfField<T extends FieldConfig> = T extends FunctionFieldConfig
  ? ResolverTypeOfFunctionField<T>
  : T extends ValueFieldConfig
  ? ResolverTypeOfValueField<T>
  : never

type ResolverTypeOfValueField<T extends ValueFieldConfig> = ResolvedValue<ResolverTypeOf<T['type']>>

type ResolverTypeOfFunctionField<T extends FunctionFieldConfig> = Optional<
  (args: ResolverTypeOfArgumentConfigMap<T['args']>) => ResolverTypeOf<T['type']>
>

type ResolverTypeOfArgumentConfigMap<T extends ArgumentConfigMap> = {
  [key in keyof T]: ResolverTypeOf<T[key]['type']>
}

export type ResolverTypeOfInterface<T extends InterfaceType> = ResolverTypeOfFields<T['fields']>

export type ResolverTypeOfInterfaces<T extends (new () => InterfaceType)[]> = UnionToIntersection<
  ResolverTypeOfInterface<InstanceType<T[number]>>
>

type ResolverTypeOfInputObject<T extends InputObjectType> = ResolverTypeOfInputFields<T['fields']>

type ResolverTypeOfInputFields<T extends InputFieldConfigs> = {
  [key in keyof T]: T[key] extends InputFieldConfig
    ? ResolverTypeOf<T[key]['type']>
    : T[key] extends TypeCtor
    ? ResolverTypeOf<T[key]>
    : never
}

type ResolverTypeOfEnum<T extends EnumType> = ResolverTypeOfEnumValue<T['values'][keyof T['values']]>

type ResolverTypeOfEnumValue<T extends EnumValueConfig> = T['value']

type ResolverTypeOfUnion<T extends UnionType> = ResolverTypeOf<T['types'][number]>

// class type

export abstract class InternalScalarType<T = unknown> extends Type<T> {
  __scalar = true
}

export abstract class ScalarType<T = unknown> extends InternalScalarType<T> {
  // Serializes an internal value to include in a response.
  serialize?(input: any): any
  // Parses an externally provided value to use as an input.
  parseValue?(input: any): any
  // Parses an externally provided literal value to use as an input.
  parseLiteral?(astNode: ValueNode): any
}

export const typename = <T extends string>(x: T): T => x

export class String extends InternalScalarType<string> {
  name = 'String' as const
}

export class Boolean extends InternalScalarType<boolean> {
  name = 'Boolean' as const
}

export class Int extends InternalScalarType<number> {
  name = 'Int' as const
}

export class Float extends InternalScalarType<number> {
  name = 'Float' as const
}

export class ID extends InternalScalarType<string> {
  name = 'ID' as const
}

export abstract class InterfaceType extends Type {
  __interface = true

  abstract fields: FieldConfigs
}

export abstract class ObjectType extends Type {
  static create<T extends ObjectType, V extends Omit<ResolverTypeOf<T>, '__typename'>>(this: new () => T, value: V) {
    return resolve(this, value)
  }

  __object = true

  interfaces?: (new () => InterfaceType)[]

  abstract fields: FieldConfigs
}

export abstract class InputObjectType extends Type {
  __inputObject = true

  abstract fields: InputFieldConfigs
}

export abstract class ListType<T extends TypeCtor = TypeCtor> extends Type<TypeOf<T>[]> {
  __list = true
  name = `[]`
  abstract Type: T
}

export const List = <T extends TypeCtor>(Type: T) => {
  return class List extends ListType<T> {
    Type = Type
  }
}

export abstract class NullableType<T extends TypeCtor = TypeCtor> extends Type<TypeOf<T> | null | undefined> {
  __nullable = true
  name = '?'
  abstract Type: T
}

export const Nullable = <T extends TypeCtor>(Type: T) => {
  return class Nullable extends NullableType<T> {
    Type = Type
  }
}

export type EnumValueConfig<T extends string | number | boolean = any> = {
  value: T
  description?: string
  deprecated?: string
}

export type EnumValueConfigs = {
  [key: string]: EnumValueConfig
}

export abstract class EnumType extends Type {
  __enum = true

  abstract values: EnumValueConfigs
}

export abstract class UnionType extends Type {
  static create<T extends UnionType, V extends Omit<ResolverTypeOf<T>, '__typename'>>(this: new () => T, value: V) {
    return resolve(this, value)
  }
  __union = true
  abstract types: (new () => ObjectType)[]
  resolveTypes?(value: any): new () => ObjectType
}

export type InputPrimitiveType = InternalScalarType | EnumType | InputObjectType | ListType

export type InputType = InputPrimitiveType | NullableType<new () => InputPrimitiveType>

export type OutputPrimitiveType = InternalScalarType | ObjectType | InterfaceType | UnionType | EnumType | ListType

export type OutputType = OutputPrimitiveType | NullableType<new () => OutputPrimitiveType>

export type Describable = {
  description?: string
  deprecated?: string
}

export type ValueFieldConfig = {
  type: new () => OutputType
  description?: string
  deprecated?: string
}

export type ArgumentConfig<T extends InputType = InputType> = Describable & {
  type: new () => T
  defaultValue?: TypeOf<T>
}

export type ArgumentConfigMap = {
  [key: string]: ArgumentConfig
}

export type FunctionFieldConfig = ValueFieldConfig & {
  args: ArgumentConfigMap
}

export type FieldConfig = ValueFieldConfig | FunctionFieldConfig

export type FieldConfigs = {
  [key: string]: (new () => OutputType) | FieldConfig
}

export type InputFieldConfig<T extends InputType = any> = Describable & {
  type: T
  defaultValue?: TypeOf<T>
}

export type InputFieldConfigs = {
  [key: string]: (new () => InputType) | InputFieldConfig
}

export const Fields = <T extends FieldConfigs>(fields: T): T => {
  return fields
}
