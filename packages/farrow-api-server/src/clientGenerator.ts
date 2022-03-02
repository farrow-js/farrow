import { createClientGenerator, getFieldType, Helpers } from 'farrow-api/dist/createGenerator'

export const serverApiHelpers: Helpers = {
  importStatements: (_, options) => {
    if (!options?.emitApiClient) return []
    return [`import { createApiPipelineWithUrl, ApiInvokeOptions } from 'farrow-api-client'`]
  },
  typeDeclarations: () => {
    return [] as string[]
  },
  variableDeclarations: (_, options) => {
    if (!options?.emitApiClient) return []
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

export const generatorClient = createClientGenerator(serverApiHelpers)
