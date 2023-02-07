import { generateApi, getFieldType, ApiClientHelpers, CodegenOptions } from 'farrow-api/dist/generateApi'
import type { FormatResult } from 'farrow-api/dist/toJSON'

export const serverApiHelpers: ApiClientHelpers = {
  importStatements: () => {
    return [`import { createApiBatchLoader, ApiBatchLoadOptions } from 'farrow-api-client'`]
  },
  typeDeclarations: () => {
    return [] as string[]
  },
  variableDeclarations: (_, options) => {
    return [`export const url = "${options?.url ?? ''}"`, `export const apiBatchLoader = createApiBatchLoader(url)`]
  },
  apiFunctionParams: (formatApi, _, formatResult) => {
    const inputType = getFieldType(formatApi.input.typeId, formatResult.types)
    return `input: ${inputType}, options?: ApiBatchLoadOptions`
  },
  apiFunctionBody: (formatApi, path, formatResult) => {
    const outputType = getFieldType(formatApi.output.typeId, formatResult.types)
    return `apiBatchLoader.load({ type: 'Single', path: ${JSON.stringify(path,)}, input }, options) as Promise<${outputType}>`
  },
}

export const generateApiClient = (formResult: FormatResult, options?: Omit<CodegenOptions, 'apiClient'>) => {
  return generateApi(formResult, {
    ...options,
    apiClient: {
      helpers: serverApiHelpers
    }
  })
}
