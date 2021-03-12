import 'isomorphic-unfetch'
import { AsyncPipeline, createAsyncPipeline, MaybeAsync, Middleware } from 'farrow-pipeline'
import type { ApiRequest, ApiResponse, JsonType, ApiErrorResponse, ApiSuccessResponse } from 'farrow-api-server'

export { ApiRequest, ApiResponse, JsonType, ApiErrorResponse, ApiSuccessResponse }

export type ApiPipeline = AsyncPipeline<ApiRequest, ApiResponse> & {
  match(pattern: string | RegExp, middleware: Middleware<ApiRequest, MaybeAsync<ApiResponse>>): void
  invoke(url: string, body: ApiRequest['body']): Promise<JsonType>
}

export const createApiPipeline = (): ApiPipeline => {
  let pipeline = createAsyncPipeline<ApiRequest, ApiResponse>()

  let run: ApiPipeline['run'] = (request, options) => {
    return pipeline.run(request, {
      ...options,
      onLast: fetcher,
    })
  }

  let match: ApiPipeline['match'] = (pattern, middleware) => {
    pipeline.use(async (request, next) => {
      if (pattern instanceof RegExp) {
        if (pattern.test(request.url)) {
          return middleware(request, next)
        }
        return next()
      }

      if (request.url.includes(pattern)) {
        return middleware(request, next)
      }

      return next()
    })
  }

  let invoke: ApiPipeline['invoke'] = async (url, body) => {
    let result = await run({ url, body })

    if (result.type === 'ApiErrorResponse') {
      throw new Error(result.error.message)
    }

    return result.output
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
  let { url, body, options: init } = request
  let options: RequestInit = {
    method: 'POST',
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: JSON.stringify(body),
  }
  let response = await fetch(url, options)
  let text = await response.text()
  let json = JSON.parse(text) as ApiResponse

  return json
}
