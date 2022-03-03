import { generateApi, getFieldType, ApiClientHelpers, CodegenOptions } from 'farrow-api/dist/generateApi'
import type { FormatResult } from 'farrow-api/dist/toJSON'

export const serverApiHelpers: ApiClientHelpers = {
  importStatements: () => {
    return [`import { createApiPipelineWithUrl, ApiInvokeOptions } from 'farrow-api-client'`]
  },
  typeDeclarations: () => {
    return [] as string[]
  },
  variableDeclarations: (_, options) => {
    return [`export const url = "${options?.url ?? ''}"`, `export const apiPipeline = createApiPipelineWithUrl(url)`]
  },
  apiFunctionParams: (formatApi, _, formatResult) => {
    const inputType = getFieldType(formatApi.input.typeId, formatResult.types)
    return `input: ${inputType}, options?: ApiInvokeOptions`
  },
  apiFunctionBody: (formatApi, path, formatResult) => {
    const outputType = getFieldType(formatApi.output.typeId, formatResult.types)
    return `apiPipeline.invoke({ type: 'Single', path: ${JSON.stringify(
      path,
    )}, input }, options) as Promise<${outputType}>
    `
  },
}

export const generatorApiClient = (formResult: FormatResult, options?: Omit<CodegenOptions, 'apiClientHelpers'>) =>
  generateApi(formResult, { ...options, apiClientHelpers: serverApiHelpers })
