import 'isomorphic-unfetch'
import 'setimmediate'
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

export type Fetcher = (request: ApiRequest) => Promise<ApiResponse>

export type ApiPipelineOptions = {
  fetcher?: Fetcher
}

export type ApiPipeline = AsyncPipeline<ApiRequest, ApiResponse> & {
  match(pattern: string | RegExp, middleware: MiddlewareInput<ApiRequest, MaybeAsync<ApiResponse>>): void
  invoke(url: string, calling: SingleCalling): Promise<JsonType | Error>
  invoke(url: string, calling: BatchCalling): Promise<(JsonType | Error)[]>
  invoke(url: string, calling: Calling): Promise<JsonType | Error | (JsonType | Error)[]>
}

export const createApiPipeline = ({ fetcher = defaultFetcher }: ApiPipelineOptions = {}): ApiPipeline => {
  const pipeline = createAsyncPipeline<ApiRequest, ApiResponse>()

  function run(
    request: ApiRequest,
    options?: RunPipelineOptions<ApiRequest, MaybeAsync<ApiResponse>>,
  ): MaybeAsync<ApiResponse> {
    return pipeline.run(request, {
      ...options,
      onLast: fetcher,
    })
  }

  const match: ApiPipeline['match'] = (pattern, middlewareInput) => {
    const middleware = getMiddleware(middlewareInput)
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
    const result = await run({ url, calling })

    const handleResult = (apiResponse: ApiResponseSingle) => {
      if (apiResponse.type === 'ApiErrorResponse') {
        return new Error(apiResponse.error.message)
      }

      return apiResponse.output
    }

    if (result.type === 'Batch') {
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

export const defaultFetcher = async (request: ApiRequest): Promise<ApiResponse> => {
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
}

export type ApiInvokeOptions = {
  batch: boolean
}

export type ApiPipelineWithUrl = AsyncPipeline<ApiRequest, ApiResponse> & {
  invoke(calling: SingleCalling, options?: ApiInvokeOptions): Promise<JsonType>
}

export const createApiPipelineWithUrl = (url: string): ApiPipelineWithUrl => {
  const pipeline = createAsyncPipeline<ApiRequest, ApiResponse>()

  const batchInvoke = (callings: Readonly<SingleCalling[]>) => {
    const calling: BatchCalling = {
      type: 'Batch',
      callings,
    }
    return apiPipeline.invoke(url, calling)
  }

  const dataLoader = new DataLoader(batchInvoke)

  const invoke: ApiPipelineWithUrl['invoke'] = async (calling, options) => {
    if (options?.batch) {
      return dataLoader.load(calling)
    }

    const result = await apiPipeline.invoke(url, calling)
    dataLoader.prime(calling, result)

    if (result instanceof Error) {
      throw result
    }

    return result
  }

  apiPipeline.match(url, pipeline)

  return {
    ...pipeline,
    invoke,
  }
}
