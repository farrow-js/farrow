import type {
    Calling,
    SingleCalling,
    BatchCalling,
    StreamCalling,
    ApiSingleResponse,
    ApiBatchResponse,
    ApiStreamSingleResponse
} from 'farrow-api-server'

import { BatchScheduler, createBatchProcessor, CreateBatchProcessorOptions } from './createBatchProcessor'

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

export interface ApiClientLoaderOptions {
    batch?: boolean
    stream?: boolean
    cache?: boolean
}

export type Loader = {
    (input: ApiClientLoaderInput, options?: ApiClientLoaderOptions): Promise<JsonType>
    fetcher: Fetcher
}

export type Fetcher = (input: Calling) => Promise<Response>

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
export const createLoader = (source: string | Fetcher, options?: CreateLoaderOptions): Loader => {
    const config = {
        batch: true,
        stream: true,
        ...options
    }

    const fetcher: Fetcher = async input => {
        if (typeof source === 'function') {
            return source(input)
        }

        const response = await fetch(source, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        })

        return response
    }

    const handleSingleResponse = (response: ApiSingleResponse): Promise<JsonType> => {
        if (response.type === 'ApiErrorResponse') {
            return Promise.reject(new Error(response.error.message))
        }

        return Promise.resolve(response.output)
    }

    const handleSingleCalling = async (singleCalling: SingleCalling) => {
        const response = await fetcher(singleCalling)

        const json = await response.json() as ApiSingleResponse

        return handleSingleResponse(json)
    }

    const handleBatchCalling = async (calling: BatchCalling) => {
        const response = await fetcher(calling)

        const json = await response.json() as ApiBatchResponse

        if (json.type === 'ApiErrorResponse') {
            throw new Error(json.error.message)
        }

        return json.result
    }

    const handleStreamCalling = async (
        calling: StreamCalling,
        onData: (response: ApiStreamSingleResponse) => void
    ) => {
        const response = await fetcher(calling)

        const handleResponse = (text: string) => {
            const list = text.split('\n')

            for (let index = 0; index < list.length; index++) {
                const item = list[index]

                if (item) {
                    const json = JSON.parse(item) as ApiStreamSingleResponse
                    onData(json)
                }
            }
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
                    handleResponse(text)
                }
            }

            /**
             * for response without readable body
             */
            const text = await response.text()
            handleResponse(text)
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
                stream: true
            })

            handleResponse(chunk)
        }
    }

    const normalBatchProcessor = createBatchProcessor<SingleCalling, JsonType>({
        cache: config.cache,
        scheduler: config.scheduler,
        onFlush: async (callings, onOutput) => {
            if (callings.length === 1) {
                const response = await handleSingleCalling(callings[0])
                onOutput(response, 0)
                return
            }

            const responseList = await handleBatchCalling({
                type: 'Batch',
                callings
            })

            for (let index = 0; index < responseList.length; index++) {
                const response = responseList[index]
                const promise = handleSingleResponse(response)
                onOutput(promise, index)
            }
        }
    })

    const streamingBatchProcessor = createBatchProcessor<SingleCalling, JsonType>({
        cache: config.cache,
        scheduler: config.scheduler,
        onFlush: (callings, onOutput) => {
            if (callings.length === 1) {
                const promise = handleSingleCalling(callings[0])
                onOutput(promise, 0)
                return
            }

            handleStreamCalling({
                type: 'Stream',
                callings
            }, (response) => {
                const promise = handleSingleResponse(response)
                onOutput(promise, response.index)
            })
        }
    })

    const loader = (async (input, loaderOptions) => {
        const { path, input: data } = input

        const singleCalling: SingleCalling = {
            type: 'Single',
            path,
            input: data
        }

        const shouldBatching = config.batch && loaderOptions?.batch !== false

        if (shouldBatching) {
            const shouldStreaming = config.stream && loaderOptions?.stream !== false

            if (shouldStreaming) {
                return streamingBatchProcessor.add(singleCalling, {
                    cache: loaderOptions?.cache
                })
            } else {
                return normalBatchProcessor.add(singleCalling, {
                    cache: loaderOptions?.cache
                })
            }
        }

        return handleSingleCalling(singleCalling)
    }) as Loader

    loader.fetcher = fetcher

    return loader
}

