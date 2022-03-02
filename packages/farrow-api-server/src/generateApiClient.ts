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
  apiFunctionParams: (formApi, _, formatResult) => {
    const inputType = getFieldType(formApi.input.typeId, formatResult.types)
    return `input: ${inputType}, options?: ApiInvokeOptions`
  },
  apiFunctionBody: (formApi, path, formatResult) => {
    const outputType = getFieldType(formApi.output.typeId, formatResult.types)
    return `apiPipeline.invoke({ type: 'Single', path: ${JSON.stringify(
      path,
    )}, input }, options) as Promise<${outputType}>
    `
  },
}

export const generatorApiClient = (formResult: FormatResult, options?: Omit<CodegenOptions, 'apiClientHelpers'>) =>
  generateApi(formResult, { ...options, apiClientHelpers: serverApiHelpers })
