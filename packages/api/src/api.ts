import { Type, Prettier, TypeOf, ToSchemaCtor, SchemaCtorInput } from 'farrow-schema'

export type MaybeReturnPromise<T extends (...args: any) => any> = T extends (...args: infer Args) => infer Return
  ? T | ((...args: Args) => Promise<Return>)
  : never

export type Typeable<T = unknown> =
  | T
  | {
      [Type]: T
      description?: string
      deprecated?: string
    }

export const getContentType = <T extends Typeable>(typeable: T): TypeOfTypeable<T> => {
  return typeable[Type] ?? typeable
}

export const getTypeDescription = (typeable: Typeable<any>): string | undefined => {
  return (typeable as any)?.description
}

export const getTypeDeprecated = (typeable: Typeable<any>): string | undefined => {
  return (typeable as any)?.deprecated
}

type TypeOfTypeable<T extends Typeable> = T extends Typeable<infer U> ? U : never

export type ApiDefinition<T extends SchemaCtorInput = any> = {
  input: Typeable<T>
  output: Typeable<T>
  description?: string
  deprecated?: string
}

type RawTypeOfTypeable<T extends Typeable<SchemaCtorInput>> = Prettier<TypeOf<ToSchemaCtor<TypeOfTypeable<T>>>>

export type TypeOfApiDefinition<T extends ApiDefinition> = MaybeReturnPromise<
  (input: Prettier<RawTypeOfTypeable<T['input']>>) => RawTypeOfTypeable<T['output']>
>

export type ApiType<T extends ApiDefinition = ApiDefinition> = TypeOfApiDefinition<T> & {
  type: 'Api'
  definition: T
}

export const isApi = <T extends ApiDefinition = ApiDefinition>(input: any): input is ApiType<T> => {
  return typeof input === 'function' && input?.type === 'Api'
}

export function createApi<T extends ApiDefinition>(api: T, fn: TypeOfApiDefinition<T>): ApiType<T> {
  let result = ((input) => fn(input)) as ApiType<T>
  result.type = 'Api'
  result.definition = api
  return result
}

export const Api = createApi

export type ApiEntries = {
  [key: string]: ApiType | ApiEntries
}
