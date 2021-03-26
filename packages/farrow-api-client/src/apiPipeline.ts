import 'isomorphic-unfetch'
import DataLoader from 'dataloader'
import {
  AsyncPipeline,
  createAsyncPipeline,
  getMiddleware,
  MaybeAsync,
  MiddlewareInput,
  RunPipelineOptions,
} from 'farrow-pipeline'
import type {
  ApiRequest,
  Calling,
  SingleCalling,
  BatchCalling,
  ApiResponse,
  JsonType,
  ApiErrorResponse,
  ApiSuccessResponse,
  ApiResponseSingle,
} from 'farrow-api-server'

export { ApiRequest, ApiResponse, JsonType, ApiErrorResponse, ApiSuccessResponse }

export type ApiPipeline = AsyncPipeline<ApiRequest, ApiResponse> & {
  match(pattern: string | RegExp, middleware: MiddlewareInput<ApiRequest, MaybeAsync<ApiResponse>>): void
  invoke(url: string, calling: SingleCalling): Promise<JsonType | Error>
  invoke(url: string, calling: BatchCalling): Promise<(JsonType | Error)[]>
  invoke(url: string, calling: Calling): Promise<JsonType | Error | (JsonType | Error)[]>
}

export const createApiPipeline = (): ApiPipeline => {
  let pipeline = createAsyncPipeline<ApiRequest, ApiResponse>()

  function run(
    request: ApiRequest,
    options?: RunPipelineOptions<ApiRequest, MaybeAsync<ApiResponse>>,
  ): MaybeAsync<ApiResponse> {
    return pipeline.run(request, {
      ...options,
      onLast: fetcher,
    })
  }

  let match: ApiPipeline['match'] = (pattern, middlewareInput) => {
    let middleware = getMiddleware(middlewareInput)
    pipeline.use((request, next) => {
      if (pattern instanceof RegExp) {
        if (pattern.test(request.url)) {
          return middleware(request, next)
        }
        return next()
      }

      if (request.url.endsWith(pattern)) {
        return middleware(request, next)
      }

      return next()
    })
  }

  async function invoke(url: string, calling: SingleCalling): Promise<JsonType | Error>
  async function invoke(url: string, calling: BatchCalling): Promise<(JsonType | Error)[]>
  async function invoke(url: string, calling: Calling): Promise<JsonType | Error | (JsonType | Error)[]> {
    let result = await run({ url, calling })

    let handleResult = (apiResponse: ApiResponseSingle) => {
      if (apiResponse.type === 'ApiErrorResponse') {
        return new Error(apiResponse.error.message)
      }

      return apiResponse.output
    }

    if ('__batch__' in result) {
      return result.result.map(handleResult)
    }
    return handleResult(result)
  }

  return {
    ...pipeline,
    run,
    match,
    invoke,
  }
}

export const apiPipeline = createApiPipeline()

export const fetcher = async (request: ApiRequest): Promise<ApiResponse> => {
  let { url, calling, options: init } = request
  let options: RequestInit = {
    method: 'POST',
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: JSON.stringify(calling),
  }
  let response = await fetch(url, options)
  let text = await response.text()
  let json = JSON.parse(text) as ApiResponse

  return json
}

export type ApiPipelineWithUrl = AsyncPipeline<ApiRequest, ApiResponse> & {
  invoke(calling: SingleCalling): Promise<JsonType>
}

export const createApiPipelineWithUrl = (url: string): ApiPipelineWithUrl => {
  let pipeline = createAsyncPipeline<ApiRequest, ApiResponse>()

  let batchInvoke = (callings: Readonly<SingleCalling[]>) => {
    let body: BatchCalling = {
      __batch__: true,
      callings,
    }
    return apiPipeline.invoke(url, body)
  }
  let dataLoader = new DataLoader(batchInvoke)

  async function invoke(calling: SingleCalling): Promise<JsonType> {
    return dataLoader.load(calling)
  }

  apiPipeline.match(url, pipeline)

  return {
    ...pipeline,
    invoke,
  }
}
