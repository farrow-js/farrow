import { Type, Prettier, TypeOf, ToSchemaCtor, SchemaCtorInput } from 'farrow-schema'

export type MaybeReturnPromise<T extends (...args: any) => any> = T extends (...args: infer Args) => infer Return
  ? T | ((...args: Args) => Promise<Return>)
  : never

export type Typable<T = unknown> =
  | T
  | {
      [Type]: T
      description?: string
      deprecated?: string
    }

export const getContentType = <T extends Typable>(typable: T): TypeOfTypable<T> => {
  return typable[Type] ?? typable
}

export const getTypeDescription = (typable: Typable<any>): string | undefined => {
  return (typable as any)?.description
}

export const getTypeDeprecated = (typable: Typable<any>): string | undefined => {
  return (typable as any)?.depcreated
}

type TypeOfTypable<T extends Typable> = T extends Typable<infer U> ? U : never

export type ApiDefinition<T extends SchemaCtorInput = any> = {
  input: Typable<T>
  output: Typable<T>
  description?: string
  deprecated?: string
}

type RawTypeOfTypable<T extends Typable<SchemaCtorInput>> = Prettier<TypeOf<ToSchemaCtor<TypeOfTypable<T>>>>

export type TypeOfApiDefinition<T extends ApiDefinition> = MaybeReturnPromise<
  (input: Prettier<RawTypeOfTypable<T['input']>>) => RawTypeOfTypable<T['output']>
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
  description?: string
  deprecated?: string
} & {
  [key: string]: ApiType | ApiEntries
}
