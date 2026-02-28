import type {
  Calling,
  SingleCalling,
  BatchCalling,
  StreamCalling,
  ApiSingleResponse,
  ApiBatchResponse,
  ApiStreamSingleResponse,
} from 'farrow-api-server'

import { BatchScheduler, createBatchProcessor } from './BatchProcessor'
import { createStreamingJsonParser } from './StreamingJsonParser'

export type JsonType =
  | number
  | string
  | boolean
  | null
  | undefined
  | JsonType[]
  | { toJSON(): string }
  | { [key: string]: JsonType }

export type ApiClientLoaderInput = {
  path: string[]
  input: JsonType
}

declare global {
  interface ApiClientLoaderOptions {
    batch?: boolean
    stream?: boolean
    cache?: boolean
  }
}

export type Loader<T extends Fetcher = Fetcher> = {
  (input: ApiClientLoaderInput, options?: ApiClientLoaderOptions): Promise<JsonType>
  fetcher: T
}

export type ApiClientLoaderFetcherOptions = Omit<ApiClientLoaderOptions, 'batch' | 'stream' | 'cache'>

export type Fetcher = (input: Calling, options: ApiClientLoaderFetcherOptions) => Promise<Response | JsonType>

export const isResponse = (value: any): value is Response => {
  return typeof value?.json === 'function' && typeof value?.text === 'function'
}

export type CreateLoaderOptions = {
  /**
   * enable batch calling
   * default is true
   * @default true
   */
  batch?: boolean
  /**
   * enable stream calling
   * default is true
   * @default true
   */
  stream?: boolean
  /**
   * enable cache
   * the api calling will be cached by input, de-duplication by input
   * default is true
   * @default true
   */
  cache?: boolean
  /**
   * custom scheduler
   */
  scheduler?: BatchScheduler
}

/**
 *
 * @param source  api server url or fetcher
 * @param options  create loader options
 * @returns  loader
 *
 * @example
 * const loader = createLoader('http://localhost:3000/api')
 * const loader = createLoader('http://localhost:3000/api', { batch: false })
 * const loader = createLoader('http://localhost:3000/api', { stream: false })
 * const loader = createLoader('http://localhost:3000/api', { cache: false })
 * const loader = createLoader('http://localhost:3000/api', { batch: false, stream: false, cache: false })
 *
 * // custom fetcher
 * const loader = createLoader(async (input) => {
 *    const response = await fetch('http://localhost:3000/api', {
 *      method: 'POST',
 *       headers: {
 *        'Content-Type': 'application/json',
 *      },
 *      body: JSON.stringify(input),
 *    })
 *
 *    return response
 * })
 */
export const createLoader = <T extends Fetcher = Fetcher>(source: string | T, options?: CreateLoaderOptions): Loader<T> => {
  const config = {
    batch: true,
    stream: true,
    ...options,
  }

  const fetcher = (async (input, options) => {
    if (typeof source === 'function') {
      return source(input, options)
    }

    const response = await fetch(source, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input)
    })

    return response
  }) as T

  const handleSingleResponse = (response: ApiSingleResponse): Promise<JsonType> => {
    if (response.type === 'ApiErrorResponse') {
      return Promise.reject(new Error(response.error.message))
    }

    return Promise.resolve(response.output)
  }

  const handleSingleCalling = async (singleCalling: SingleCalling, options: ApiClientLoaderFetcherOptions) => {
    const response = await fetcher(singleCalling, options)

    let json: ApiSingleResponse

    if (!isResponse(response)) {
      json = response as ApiSingleResponse
    } else {
      json = await response.json() as ApiSingleResponse
    }

    return handleSingleResponse(json)
  }

  const handleBatchCalling = async (calling: BatchCalling, options: ApiClientLoaderFetcherOptions) => {
    const response = await fetcher(calling, options)

    let json: ApiBatchResponse

    if (!isResponse(response)) {
      json = response as ApiBatchResponse
    } else {
      json = await response.json() as ApiBatchResponse
    }

    if (json.type === 'ApiErrorResponse') {
      throw new Error(json.error.message)
    }

    return json.result
  }

  const handleStreamCalling = async (
    calling: StreamCalling,
    options: ApiClientLoaderFetcherOptions,
    onData: (response: ApiStreamSingleResponse) => void
  ) => {
    const response = await fetcher(calling, options)

    const parser = createStreamingJsonParser({
      onJson: onData,
    })

    if (!isResponse(response)) {
      if (!Array.isArray(response)) {
        throw new Error('StreamCalling: response is not a Response or Array')
      }

      const json = response as ApiStreamSingleResponse[]

      for (const item of json) {
        onData(item)
      }

      return
    }


    const reader = typeof response.body?.getReader === 'function' ? response.body.getReader() : null

    if (!reader) {
      /**
       * for node-fetch
       * its body is not a ReadableStream, but it has Symbol.asyncIterator
       */
      if (response.body && Symbol.asyncIterator in response.body) {
        for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
          const text = chunk.toString()
          parser.write(text)
        }
      }

      /**
       * for response without readable body
       */
      const text = await response.text()
      parser.write(text)
      return
    }

    /**
     * for browsers or environments that support ReadableStream
     */
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      const chunk = decoder.decode(value, {
        stream: true,
      })

      parser.write(chunk)
    }
  }

  const normalBatchProcessor = createBatchProcessor<SingleCalling, ApiClientLoaderFetcherOptions, JsonType>({
    cache: config.cache,
    scheduler: config.scheduler,
    onFlush: async (callings, options, onOutput) => {
      if (callings.length === 1) {
        const promise = handleSingleCalling(callings[0], options)
        onOutput(promise, 0)
        return
      }

      try {
        const responseList = await handleBatchCalling({
          type: 'Batch',
          callings,
        }, options)

        for (let index = 0; index < responseList.length; index++) {
          const response = responseList[index]
          const promise = handleSingleResponse(response)
          onOutput(promise, index)
        }
      } catch (error) {
        for (let index = 0; index < callings.length; index++) {
          const promise = Promise.reject(error)
          onOutput(promise, index)
        }
      }
    },
  })

  const streamingBatchProcessor = createBatchProcessor<SingleCalling, ApiClientLoaderFetcherOptions, JsonType>({
    cache: config.cache,
    scheduler: config.scheduler,
    onFlush: (callings, options, onOutput) => {
      if (callings.length === 1) {
        const promise = handleSingleCalling(callings[0], options)
        onOutput(promise, 0)
        return
      }

      handleStreamCalling(
        {
          type: 'Stream',
          callings,
        },
        options,
        (response) => {
          const promise = handleSingleResponse(response)
          onOutput(promise, response.index)
        },
      )
    },
  })

  const loader = (async (input, loaderOptions = {}) => {
    const { path, input: data } = input

    const singleCalling: SingleCalling = {
      type: 'Single',
      path,
      input: data,
    }

    const { cache, batch, stream, ...fetcherOptions } = loaderOptions
    const shouldBatching = config.batch && batch !== false

    if (shouldBatching) {
      const shouldStreaming = config.stream && stream !== false

      if (shouldStreaming) {
        return streamingBatchProcessor.add(singleCalling, fetcherOptions, { cache })
      } else {
        return normalBatchProcessor.add(singleCalling, fetcherOptions, { cache })
      }
    }

    return handleSingleCalling(singleCalling, fetcherOptions)
  }) as Loader<T>

  loader.fetcher = fetcher

  return loader
}
