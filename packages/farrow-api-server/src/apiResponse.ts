import type { JsonType } from 'farrow-schema'

export { JsonType }

export type ApiRequest = {
  url: string
  body: {
    path: string[]
    input: JsonType
  }
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

export type ApiResponse = ApiErrorResponse | ApiSuccessResponse
