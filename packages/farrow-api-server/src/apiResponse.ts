import type { JsonType } from 'farrow-schema'

export { JsonType }

// __introspection__ = true is no need since we have tag now.
export type IntrospectionCalling = {
  type: 'Introspection'
}

export type SingleCalling = {
  type: 'Single'
  path: string[]
  input: Readonly<JsonType>
}

// __batch__ = true is no need since we have tag now
export type BatchCalling = {
  type: 'Batch'
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
    type: 'Batch',
    result,
  }
}

export type ApiResponseSingle = ApiErrorResponse | ApiSuccessResponse

export type ApiResponseBatch = {
  type: 'Batch'
  result: ApiResponseSingle[]
}

export type ApiResponse = ApiResponseSingle | ApiResponseBatch
