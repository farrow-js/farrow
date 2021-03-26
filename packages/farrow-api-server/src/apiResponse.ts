import type { JsonType } from 'farrow-schema'

export { JsonType }

export type IntrospectionCalling = {
  input: {
    __introspection__: true
  }
}

export type SingleCalling = {
  path: string[]
  input: Readonly<JsonType>
}

export type BatchCalling = {
  __batch__: true
  callings: Readonly<SingleCalling[]>
}

export type Calling = SingleCalling | BatchCalling | IntrospectionCalling

export type ApiRequest = {
  url: string
  calling: Calling
  options?: RequestInit
}

export type ApiErrorResponse = {
  type: 'ApiErrorResponse'
  error: {
    message: string
  }
}

export const ApiError = (message: string): ApiErrorResponse => {
  return {
    type: 'ApiErrorResponse',
    error: { message },
  }
}

export const isApiError = (input: any): input is ApiErrorResponse => {
  return input?.type === 'ApiErrorResponse'
}

export type ApiSuccessResponse = {
  type: 'ApiSuccessResponse'
  output: JsonType
}

export const ApiSuccess = (output: JsonType): ApiSuccessResponse => {
  return {
    type: 'ApiSuccessResponse',
    output,
  }
}

export const isApiSuccess = (input: any): input is ApiSuccessResponse => {
  return input?.type === 'ApiSuccessResponse'
}

export const BatchResponse = (result: ApiResponseSingle[]): ApiResponseBatch => {
  return {
    __batch__: true,
    result,
  }
}

export type ApiResponseSingle = ApiErrorResponse | ApiSuccessResponse
export type ApiResponseBatch = {
  __batch__: true
  result: ApiResponseSingle[]
}

export type ApiResponse = ApiResponseSingle | ApiResponseBatch
