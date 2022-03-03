import { Type, Prettier, TypeOf, ToSchemaCtor, SchemaCtorInput, JsonType } from 'farrow-schema'
import { createAsyncPipeline, AsyncPipeline, MaybeAsync, useContainer, Container } from 'farrow-pipeline'

export type { JsonType }

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
  /**
   * input schema of api
   */
  input: Typeable<Input>
  /**
   * output schema of api
   */
  output: Typeable<Output>
  /**
   * description of api
   */
  description?: string
  /**
   * depcreated info of api if needed
   */
  deprecated?: string
}

export type TypeOfTypeable<T extends Typeable<SchemaCtorInput>> = Prettier<TypeOf<ToSchemaCtor<TypeableContentType<T>>>>

export type ApiImpl<T extends ApiDefinition> = (
  input: TypeOfTypeable<T['input']>,
) => MaybeAsync<TypeOfTypeable<T['output']>>

export type ApiPipeline<T extends ApiDefinition = ApiDefinition> = AsyncPipeline<
  TypeOfTypeable<T['input']>,
  TypeOfTypeable<T['output']>
>

export type ApiSchema<T extends ApiDefinition = ApiDefinition> = {
  type: 'Api'
  definition: T
}

export type ApiMethods<T extends ApiDefinition = ApiDefinition> = {
  new: () => ApiType<T>
}

export type ApiType<T extends ApiDefinition = ApiDefinition> = ApiImpl<T> &
  ApiSchema<T> &
  ApiPipeline<T> &
  ApiMethods<T>

export const isApi = <T extends ApiDefinition = ApiDefinition>(input: any): input is ApiType<T> => {
  return typeof input === 'function' && input?.type === 'Api'
}

const useContainerSafe = (): Container | undefined => {
  try {
    return useContainer()
    // eslint-disable-next-line no-empty
  } catch (_) {}
}

export function createApi<T extends ApiDefinition>(definition: T, impl?: ApiImpl<T>): ApiType<T> {
  const apiPipeline: ApiPipeline<T> = createAsyncPipeline()

  const apiSchema: ApiSchema<T> = {
    type: 'Api',
    definition,
  }

  const apiImpl: ApiImpl<T> = (input) => {
    const container = useContainerSafe()
    return apiPipeline.run(input, {
      container,
    })
  }

  const apiMethods: ApiMethods<T> = {
    new() {
      return createApi(definition, impl)
    },
  }

  if (impl) {
    apiPipeline.use(impl)
  }

  return Object.assign(apiImpl, apiSchema, apiPipeline, apiMethods)
}

export const Api = createApi

export type ApiEntries = {
  [key: string]: ApiType | ApiEntries
}
