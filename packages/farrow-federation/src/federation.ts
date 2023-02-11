import { Router, Response } from 'farrow-http'
import nodeFetch from 'node-fetch'
import {
  SingleCalling,
  BatchCalling,
  ApiSingleResponse,
  ApiErrorResponse,
  ApiBatchSuccessResponse,
} from 'farrow-api-server'
import { getFederationInfo } from './info'
import { createFetcher } from './helpers'

export type ApiService = {
  url: string
  namespace: string
}

export type ApiServices = ApiService[]

export type ApiEntryMap = Map<string, string>

export type Fetch = typeof fetch

export type ApiSingleRequest = {
  url: string
  calling: SingleCalling
  options?: RequestInit
}

export type ApiBatchRequest = {
  url: string
  calling: BatchCalling
  options?: RequestInit
}
export type Fetcher = ((request: ApiSingleRequest) => Promise<ApiSingleResponse>) &
  ((request: ApiBatchRequest) => Promise<ApiBatchSuccessResponse>)

export type FederationOptions = {
  fetch?: Fetch
  fetcher?: Fetcher
  polling?: boolean
  pollingInterval?: number
  errorStack?: boolean
  strict?: boolean
}

const defaultOptions = {
  fetch: nodeFetch as any,
  polling: false,
  pollingInterval: 3000,
  strict: true,
}

const UNKNOWN_REQUEST_MESSAGE = 'Unknown structure of request'

export const createFederationServices = async (services: ApiServices, customOptions: FederationOptions = {}) => {
  const isNotProduction = process.env.NODE_ENV !== 'production'
  const options: Required<FederationOptions> = {
    ...defaultOptions,
    errorStack: isNotProduction,
    fetcher: createFetcher(customOptions?.fetch || defaultOptions.fetch),
    ...customOptions,
  }

  const router = Router()

  let info = await getFederationInfo(services, options)
  const polling = async () => {
    info = await getFederationInfo(services, options)
  }

  const getApiEntry = (namespace: string): string | undefined => {
    return info.entryMap.get(namespace)
  }

  const handleCalling = (
    calling: SingleCalling,
    init: RequestInit = {},
  ): Promise<ApiSingleResponse> | ApiSingleResponse => {
    const apiEntry = getApiEntry(calling.path[0])

    if (!apiEntry) {
      const message = `The target API was not found with the path: [${calling.path.join(', ')}]`
      return ApiErrorResponse(message)
    }

    const wrapCalling: SingleCalling = {
      ...calling,
      path: calling.path.slice(1),
    }

    const request: ApiSingleRequest = {
      url: apiEntry,
      calling: wrapCalling,
      options: init,
    }

    return options.fetcher(request)
  }

  router.use(async (request, next) => {
    if (request.method?.toLowerCase() !== 'post') {
      return next()
    }

    const init: RequestInit = {
      headers: request.headers,
    }

    if (request.body?.type === 'Batch') {
      // batch calling
      const callings = request.body!.callings

      if (Array.isArray(callings)) {
        const result = await Promise.all(callings.map((calling) => handleCalling(calling, init)))
        return Response.json(ApiBatchSuccessResponse(result))
      }

      return Response.json(ApiErrorResponse(UNKNOWN_REQUEST_MESSAGE))
    }

    // single calling
    return Response.json(await handleCalling(request.body, init))
  })

  /**
   * capture introspection request
   */
  router.use((request, next) => {
    if (request.pathname !== '/__introspection__' || request.method?.toLowerCase() !== 'get') {
      return next()
    }

    return Response.json(info.schema)
  })

  if (options.polling) {
    setInterval(polling, options.pollingInterval)
  }

  return router
}

export const Federation = createFederationServices
