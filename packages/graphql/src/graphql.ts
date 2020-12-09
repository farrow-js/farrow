const Phantom = Symbol('phantom')

type Phantom = typeof Phantom

export abstract class Type<T = unknown> {
  [Phantom]: T | Phantom = Phantom
  abstract __typename: string
  __description: string = ''
}

export const typename = <T extends string>(name: T): T => {
  return name
}

export const field = <T extends FieldConfig>(config: T): T => {
  return config
}

export type TypeCtor = new () => Type

export type TypeOf<T extends Type | TypeCtor> = T extends TypeCtor
  ? TypeOf<InstanceType<T>>
  : T extends ObjectType ? TypeOfObject<T>
  : T extends InputObjectType ? TypeOfInputObject<T>
  : T extends EnumType ? TypeOfEnum<T>
  : T extends InterfaceType ? TypeOfInterface<T>
  : T extends Type<infer U>
  ? U
  : never

type TypeOfObject<T extends ObjectType> = {
  __typename: T['__typename']
} & {
  [key in keyof T as T[key] extends FieldConfig ? key : never]?: T[key] extends FieldConfig ? TypeOfField<T[key]> : never
} & TypeOfInterfaces<T['__interfaces']>

type TypeOfField<T extends FieldConfig> = 
  T extends FunctionFieldConfig ? TypeOfFunctionField<T> : 
  T extends ValueFieldConfig ? TypeOfValueField<T> :
  never

type TypeOfValueField<T extends ValueFieldConfig> = TypeOf<T['type']>

type TypeOfFunctionField<T extends FunctionFieldConfig> = (args: TypeOfArgumentConfigMap<T['args']>) => TypeOf<T['type']>

type TypeOfArgumentConfigMap<T extends ArgumentConfigMap> = {
  [key in keyof T]: TypeOf<T[key]['type']>
}

type TypeOfInterface<T extends InterfaceType> = {
  __typename: T['__typename']
} & {
  [key in keyof T as T[key] extends FieldConfig ? key : never]?: T[key] extends FieldConfig ? TypeOfField<T[key]> : never
}

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never

type TypeOfInterfaces<T extends (new () => InterfaceType)[]> = UnionToIntersection<TypeOfInterface<InstanceType<T[number]>>>

type TypeOfInputObject<T extends InputObjectType> = {
  __typename: T['__typename']
} & {
  [key in keyof T as T[key] extends InputFieldConfig ? key : never]?: T[key] extends InputFieldConfig ? TypeOf<T[key]['type']> : never
}

type TypeOfEnum<T extends EnumType> = TypeOfEnumValue<Extract<T[Extract<keyof T, string>], EnumValueConfig>>

type TypeOfEnumValue<T extends EnumValueConfig> = T['value']

export abstract class ScalarType<T = unknown> extends Type<T> {
  __scalar = true
}

export class String extends ScalarType<string> {
  __typename = 'String' as const
}

export class Boolean extends ScalarType<boolean> {
  __typename = 'Boolean' as const
}

export class Int extends ScalarType<number> {
  __typename = 'Int' as const
}

export class Float extends ScalarType<number> {
  __typename = 'Float' as const
}

export class ID extends ScalarType<string> {
  __typename = 'ID' as const
}

export abstract class ObjectType extends Type {
  __object = true
  __interfaces: (new () => InterfaceType)[] = []
}

export abstract class InputObjectType extends Type {
  __inputObject = true
}

export abstract class ListType<T extends TypeCtor = TypeCtor> extends Type<TypeOf<T>[]> {
  __list = true
  __typename = '[]'
  abstract Type: T
}

export const List = <T extends TypeCtor>(Type: T) => {
  return class List extends ListType<T> {
    Type = Type
  }
}

export abstract class NullableType<T extends TypeCtor = TypeCtor> extends Type<TypeOf<T> | null | undefined> {
  __nullable = true
  __typename = '?'
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

export abstract class EnumType extends Type {
  __enum = true
}


type TypeOfUnionItem<T extends TypeCtor> = T extends TypeCtor ? TypeOf<T> : never

export abstract class UnionType<T extends TypeCtor[] = TypeCtor[]> extends Type<TypeOfUnionItem<T[number]>> {
  __union = true
  abstract Types: T
}

export abstract class InterfaceType extends Type {
  __interface = true
}

export type InputPrimitiveType = ScalarType | EnumType | InputObjectType | ListType

export type InputType = InputPrimitiveType | NullableType<new () => InputPrimitiveType>

export type OutputPrimitiveType = ScalarType | ObjectType | InterfaceType | UnionType | EnumType | ListType

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

export type ArgumentConfig = Describable & {
  type: new () => InputType
}

export type ArgumentConfigMap = {
  [key: string]: ArgumentConfig
}

export type FunctionFieldConfig = ValueFieldConfig & {
  args: ArgumentConfigMap
}

export type FieldConfig = ValueFieldConfig | FunctionFieldConfig

export type InputFieldConfig<T extends InputType = InputType> = Describable & {
  type: new () => T,
  defaultValue?: TypeOf<T>
}