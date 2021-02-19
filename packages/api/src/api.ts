import { Type, Prettier, TypeOf, ToSchemaCtor, SchemaCtorInput } from 'farrow-schema'

export type ImplFunctionType<Input, Output> =
  | ((input: Input) => Output)
  | ((input: Input) => Promise<Output>)
  | ((input: Input) => Output | Promise<Output>)

export type Typeable<T = unknown> =
  | T
  | {
      [Type]: T
      description?: string
      deprecated?: string
    }

type TypeableContentType<T extends Typeable> = T extends Typeable<infer U> ? U : never

export const getContentType = <T extends Typeable>(typeable: T): TypeableContentType<T> => {
  return typeable[Type] ?? typeable
}

export const getTypeDescription = (typeable: Typeable<any>): string | undefined => {
  return (typeable as any)?.description
}

export const getTypeDeprecated = (typeable: Typeable<any>): string | undefined => {
  return (typeable as any)?.deprecated
}

export type ApiDefinition<Input extends SchemaCtorInput = any, Output extends SchemaCtorInput = any> = {
  input: Typeable<Input>
  output: Typeable<Output>
  description?: string
  deprecated?: string
}

export type TypeOfTypeable<T extends Typeable<SchemaCtorInput>> = Prettier<TypeOf<ToSchemaCtor<TypeableContentType<T>>>>

export type TypeOfApiImpl<T extends ApiDefinition> = ImplFunctionType<
  TypeOfTypeable<T['input']>,
  TypeOfTypeable<T['output']>
>

export type ApiType<T extends ApiDefinition = ApiDefinition, F extends TypeOfApiImpl<T> = TypeOfApiImpl<T>> = F & {
  type: 'Api'
  definition: T
}

export const isApi = <T extends ApiDefinition = ApiDefinition>(input: any): input is ApiType<T> => {
  return typeof input === 'function' && input?.type === 'Api'
}

export function createApi<T extends ApiDefinition, F extends TypeOfApiImpl<T>>(api: T, fn: F): ApiType<T, F> {
  let result = ((input) => fn(input)) as ApiType<T, F>
  result.type = 'Api'
  result.definition = api
  return result
}

export const Api = createApi

export type ApiEntries = {
  [key: string]: ApiType | ApiEntries
}
