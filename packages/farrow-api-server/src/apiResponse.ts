import type { JsonType } from 'farrow-schema'

export type SingleCalling = {
  type: 'Single'
  path: string[]
  input: Readonly<JsonType>
}

export type BatchCalling = {
  type: 'Batch'
  callings: Readonly<SingleCalling[]>
}

export type StreamCalling = {
  type: 'Stream'
  callings: Readonly<SingleCalling[]>
}

export type Calling = SingleCalling | BatchCalling | StreamCalling

export type ApiErrorResponse = {
  type: 'ApiErrorResponse'
  error: {
    message: string
  }
}

export const ApiErrorResponse = (message: string): ApiErrorResponse => {
  return {
    type: 'ApiErrorResponse',
    error: { message },
  }
}

export const isApiErrorResponse = (input: any): input is ApiErrorResponse => {
  return input?.type === 'ApiErrorResponse'
}

export type ApiSingleSuccessResponse = {
  type: 'ApiSingleSuccessResponse'
  output: JsonType
}

export const ApiSingleSuccessResponse = (output: ApiSingleSuccessResponse['output']): ApiSingleSuccessResponse => {
  return {
    type: 'ApiSingleSuccessResponse',
    output,
  }
}

export const isApiSingleSuccessResponse = (input: any): input is ApiSingleSuccessResponse => {
  return input?.type === 'ApiSingleSuccessResponse'
}

export type ApiSingleResponse = ApiSingleSuccessResponse | ApiErrorResponse

export type StreamApiSingleResponse = ApiSingleResponse & { index: number }

export const StreamApiSingleResponse = (index: number, response: ApiSingleResponse,): StreamApiSingleResponse => {
  return {
    ...response,
    index,
  }
}

export type ApiBatchSuccessResponse = {
  type: 'ApiBatchSuccessResponse'
  result: ApiSingleResponse[]
}

export const ApiBatchSuccessResponse = (result: ApiBatchSuccessResponse['result']): ApiBatchSuccessResponse => {
  return {
    type: 'ApiBatchSuccessResponse',
    result,
  }
}

export const isApiBatchSuccessResponse = (input: any): input is ApiBatchSuccessResponse => {
  return input?.type === 'ApiBatchSuccessResponse'
}

export type ApiBatchResponse = ApiBatchSuccessResponse | ApiErrorResponse

export type ApiSuccessResponse = ApiSingleSuccessResponse | ApiBatchSuccessResponse

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse
