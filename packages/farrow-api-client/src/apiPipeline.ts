import 'isomorphic-unfetch'
import 'setimmediate'

import DataLoader from 'dataloader'
import {
  AsyncPipeline,
  createAsyncPipeline,
  getMiddleware,
  MaybeAsync,
  MiddlewareInput,
  RunAsyncPipelineOptions,
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
  ApiSingleResponse,
  ApiBatchResponse,
} from 'farrow-api-server'

export { ApiRequest, ApiResponse, JsonType, ApiErrorResponse, ApiSuccessResponse }

export type Fetcher = (request: ApiRequest) => Promise<ApiResponse>

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

const cacheKeyFn = (input: unknown) => JSON.stringify(input)

const throwErrorIfNeeded = <T>(result: Error | T): T => {
  if (result instanceof Error) {
    throw result
  }

  return result
}

let fetcher = defaultFetcher

export const setFetcher = (newFetcher: Fetcher) => {
  fetcher = newFetcher
}

export const getFetcher = () => {
  return fetcher
}

export type ApiPipelineOptions = {}

export type ApiInvokeOptions = RunAsyncPipelineOptions<ApiRequest, ApiResponse> & {
  fetcher?: Fetcher
}

export type ApiPipeline = AsyncPipeline<ApiRequest, ApiResponse> & {
  match(pattern: string | RegExp, middleware: MiddlewareInput<ApiRequest, MaybeAsync<ApiResponse>>): void
  singleInvoke(url: string, calling: SingleCalling, options?: ApiInvokeOptions): Promise<JsonType | Error>
  batchInvoke(url: string, calling: BatchCalling, options?: ApiInvokeOptions): Promise<Error | (JsonType | Error)[]>
  invoke(url: string, calling: Calling, options?: ApiInvokeOptions): Promise<JsonType | Error | (JsonType | Error)[]>
}

// eslint-disable-next-line no-empty-pattern
export const createApiPipeline = ({ }: ApiPipelineOptions = {}): ApiPipeline => {
  const pipeline = createAsyncPipeline<ApiRequest, ApiResponse>()

  const run: ApiPipeline['run'] = (request, options) => {
    return pipeline.run(request, {
      onLast: (input) => fetcher(input),
      ...options,
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

  const singleInvoke = async (url: string, calling: SingleCalling, options?: ApiInvokeOptions) => {
    const runOptions = {} as RunAsyncPipelineOptions<ApiRequest, ApiResponse>

    if (options?.fetcher) {
      runOptions.onLast = options.fetcher
    }

    const apiResponse = (await run({ url, calling }, runOptions)) as ApiSingleResponse

    return handleApiSingleResponse(apiResponse)
  }

  const batchInvoke = async (url: string, calling: BatchCalling, options?: ApiInvokeOptions) => {
    const runOptions = {} as RunAsyncPipelineOptions<ApiRequest, ApiResponse>

    if (options?.fetcher) {
      runOptions.onLast = options.fetcher
    }

    const apiResponse = (await run({ url, calling }, runOptions)) as ApiBatchResponse

    return handleApiBatchResponse(apiResponse)
  }

  const invoke = async (url: string, calling: Calling, options?: ApiInvokeOptions) => {
    if (calling.type === 'Single') {
      return singleInvoke(url, calling, options)
    }

    if (calling.type === 'Batch') {
      return batchInvoke(url, calling, options)
    }

    throw new Error(`Unknown input of calling: ${calling}`)
  }

  const handleApiSingleResponse = (apiResponse: ApiSingleResponse): JsonType | Error => {
    if (apiResponse.type === 'ApiErrorResponse') {
      return new Error(apiResponse.error.message)
    }

    if (apiResponse.type === 'ApiSingleSuccessResponse') {
      return apiResponse.output
    }

    throw new Error(`Unknown input: ${apiResponse}`)
  }

  const handleApiBatchResponse = (apiResponse: ApiBatchResponse) => {
    if (apiResponse.type === 'ApiErrorResponse') {
      return new Error(apiResponse.error.message)
    }

    if (apiResponse.type === 'ApiBatchSuccessResponse') {
      return apiResponse.result.map(handleApiSingleResponse)
    }

    throw new Error(`Unknown input: ${apiResponse}`)
  }

  return {
    ...pipeline,
    run,
    match,
    singleInvoke,
    batchInvoke,
    invoke,
  }
}

export const apiPipeline = createApiPipeline()

export type ApiBatchLoadOptions = {
  /**
   * enable batching or not
   */
  batch?: boolean
}

export type ApiBatchLoader = {
  load(calling: SingleCalling, options?: ApiBatchLoadOptions): Promise<JsonType>
}

export const createApiBatchLoader = (url: string): ApiBatchLoader => {
  const batchLoadFn = async (callings: Readonly<SingleCalling[]>) => {
    if (callings.length === 1) {
      const result = await apiPipeline.singleInvoke(url, callings[0])
      return [result]
    }

    const calling: BatchCalling = {
      type: 'Batch',
      callings,
    }

    const result = await apiPipeline.batchInvoke(url, calling)

    if (result instanceof Error) {
      return Array(callings.length).fill(result) as Error[]
    }

    return result
  }

  const dataLoader = new DataLoader(async (callings: Readonly<SingleCalling[]>) => {
    try {
      return batchLoadFn(callings)
    } finally {
      // clear all cache in every batched load for performing new request
      dataLoader.clearAll()
    }
  }, { cacheKeyFn })

  const load: ApiBatchLoader['load'] = (calling, options) => {
    if (options?.batch !== false) {
      return dataLoader.load(calling).then(throwErrorIfNeeded)
    }

    const resultPromise = apiPipeline.singleInvoke(url, calling).then(throwErrorIfNeeded)

    dataLoader.prime(calling, resultPromise as any)

    return resultPromise
  }

  return {
    load,
  }
}
