import { generateApi, getFieldType, ApiClientHelpers, CodegenOptions } from 'farrow-api/dist/generateApi'
import type { FormatResult } from 'farrow-api/dist/toJSON'

export const serverApiHelpers: ApiClientHelpers = {
  importStatements: () => {
    return [] as string[]
  },
  typeDeclarations: () => {
    return [
      `export type SingleCalling = {
        type: 'Single'
        path: string[]
        input: Readonly<JsonType>
      }`,
      `export type ApiRequest = {
        url: string
        calling: SingleCalling
        options?: RequestInit
      }`,
      `export type ApiErrorResponse = {
        type: 'ApiErrorResponse'
        error: {
          message: string
        }
      }`,
      `export type ApiSuccessResponse = {
        type: 'ApiSuccessResponse'
        output: JsonType
      }`,
      `export type ApiResponse = ApiErrorResponse | ApiSuccessResponse`,
    ] as string[]
  },
  variableDeclarations: (_, options) => {
    return [
      `export const fetcher = async (request: ApiRequest): Promise<ApiResponse> => {
        const { url, calling, options: init } = request
        const options: RequestInit = {
          method: 'POST',
          credentials: 'include',
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
          },
          body: JSON.stringify(calling),
        }
        const response = await fetch(url, options)
        const text = await response.text()
        const json = JSON.parse(text) as ApiResponse
      
        return json
      }`,
      `export const invoke = async (calling: SingleCalling): Promise<JsonType> => {
        const result = await fetcher({ url, calling }).catch((err) => {
          throw err
        })
      
        const handleResult = (apiResponse: ApiResponse): JsonType => {
          if (apiResponse.type === 'ApiErrorResponse') {
            throw new Error(apiResponse.error.message)
          }
      
          return apiResponse.output
        }
        return handleResult(result)
      }`,
      `export const url = "${options?.url ?? ''}"`,
    ]
  },
  apiFunctionParams: (formatApi, _, formatResult) => {
    const inputType = getFieldType(formatApi.input.typeId, formatResult.types)
    return `input: ${inputType}`
  },
  apiFunctionBody: (formatApi, path, formatResult) => {
    const outputType = getFieldType(formatApi.output.typeId, formatResult.types)
    return `invoke({ type: 'Single', path: ${JSON.stringify(path)}, input }) as Promise<${outputType}>`
  },
}

export const generateApiClient = (formResult: FormatResult, options?: Omit<CodegenOptions, 'apiClient'>) => {
  return generateApi(formResult, {
    ...options,
    apiClient: {
      helpers: serverApiHelpers,
    },
  })
}
