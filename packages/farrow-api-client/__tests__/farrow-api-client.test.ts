import { Int, Literal, Type } from 'farrow-schema'
import { Http, HttpPipeline, HttpPipelineOptions } from 'farrow-http'
import { Api } from 'farrow-api'
import fetch from 'node-fetch'
import { ApiService } from 'farrow-api-server'
import { Server } from 'http'

import { Loader, createLoader } from '../src'


globalThis.fetch = fetch as any

let portUid = 4000

const delay = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

const createHttp = (options?: HttpPipelineOptions) => {
    return Http({
        logger: false,
        ...options,
    })
}

let count = 0

const getCount = Api(
    {
        input: {},
        output: {
            from: {
                description: 'from',
                [Type]: Literal('getCount'),
            },
            count: {
                description: 'count of counter',
                [Type]: Int,
            },
        },
    },
    () => {
        return {
            from: 'getCount' as const,
            count,
        }
    },
)

const setCount = Api(
    {
        input: {
            newCount: {
                description: 'new count value',
                [Type]: Int,
            },
        },
        output: {
            from: {
                description: 'from',
                [Type]: Literal('setCount'),
            },
            count: {
                description: 'count of counter',
                [Type]: Int,
            },
        },
    },
    async (input) => {
        await delay(10)
        count = input.newCount
        return {
            from: 'setCount' as const,
            count,
        }
    },
)

const triggerError = Api(
    {
        input: {},
        output: {},
    },
    () => {
        throw new Error('trigger error')
    },
)

const entries = {
    getCount,
    setCount,
    triggerError,
}

const CounterService = ApiService({
    entries,
    errorStack: false,
})

describe('farrow-api-client', () => {
    let server: Server
    let http: HttpPipeline
    let baseUrl: string
    let loader: Loader

    beforeEach((done) => {
        let port = portUid++
        http = createHttp()
        server = http.server()
        http.route('/counter').use(CounterService)
        baseUrl = `http://localhost:${port}`

        loader = createLoader(baseUrl + '/counter')

        /**
         * reset count
         */
        count = 0

        server.listen(port, done)
    })

    afterEach((done) => {
        server.close(done)
    })


    it('supports calling api', async () => {

        const result0 = await loader({
            path: ['getCount'],
            input: {},
        })

        expect(result0).toEqual({
            from: 'getCount',
            count: 0,
        })

        const result1 = await loader({
            path: ['setCount'],
            input: {
                newCount: 10,
            },
        })

        expect(result1).toEqual({
            from: 'setCount',
            count: 10,
        })

        const result2 = await loader({
            path: ['getCount'],
            input: {},
        })

        expect(result2).toEqual({
            from: 'getCount',
            count: 10,
        })
    })

    it('should response error if api thrown', async () => {
        try {
            await loader({
                path: ['triggerError'],
                input: {},
            })
            throw new Error('should not reach here')
        } catch (error: unknown) {
            if (!(error instanceof Error)) {
                throw error
            }
            expect(error.message).toEqual('trigger error')
        }
    })

    it('should response error if api was not existed', async () => {
        try {
            await loader({
                path: ['nonExisted'],
                input: {},
            })
            throw new Error('should not reach here')
        } catch (error: unknown) {
            if (!(error instanceof Error)) {
                throw error
            }
            expect(error.message).toEqual('The target API was not found with the path: ["nonExisted"]')
        }
    })

    it('should response error if input is not valid', async () => {
        try {
            await loader({
                path: ['setCount'],
                input: {
                    newCount: false,
                },
            })
            throw new Error('should not reach here')
        } catch (error: unknown) {
            if (!(error instanceof Error)) {
                throw error
            }
            expect(error.message).toEqual('path: ["newCount"]\nfalse is not an integer')
        }
    })

    it('supports batch calling api', async () => {
        let innerLoaderCallback = jest.fn()
        const innerLoader = createLoader((calling) => {
            innerLoaderCallback(calling)
            return loader.fetcher(calling)
        })

        const [result0, result1, result2] = await Promise.all([
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                stream: false
            }),
            innerLoader({
                path: ['setCount'],
                input: {
                    newCount: 10,
                },
            }, {
                stream: false
            }),
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                stream: false
            }),
        ])

        /**
         * auto merge the same api callings
         * so there is only one calling for getCount
         */
        expect(innerLoaderCallback).lastCalledWith({
            type: 'Batch',
            callings: [
                {
                    type: 'Single',
                    path: ['getCount'],
                    input: {},
                },
                {
                    type: 'Single',
                    path: ['setCount'],
                    input: {
                        newCount: 10,
                    },
                }
            ],
        })

        expect(result0).toEqual({
            from: 'getCount',
            count: 0,
        })

        expect(result1).toEqual({
            from: 'setCount',
            count: 10,
        })

        expect(result2).toEqual({
            from: 'getCount',
            count: 0,
        })
    })

    it('supports streaming batch calling api', async () => {
        let innerLoaderCallback = jest.fn()
        const innerLoader = createLoader((calling) => {
            innerLoaderCallback(calling)
            return loader.fetcher(calling)
        })

        const [result0, result1, result2] = await Promise.all([
            innerLoader({
                path: ['getCount'],
                input: {},
            }),
            innerLoader({
                path: ['setCount'],
                input: {
                    newCount: 10,
                },
            }),
            innerLoader({
                path: ['getCount'],
                input: {},
            }),
        ])

        expect(innerLoaderCallback).lastCalledWith({
            type: 'Stream',
            callings: [
                {
                    type: 'Single',
                    path: ['getCount'],
                    input: {},
                },
                {
                    type: 'Single',
                    path: ['setCount'],
                    input: {
                        newCount: 10,
                    },
                },
            ],
        })

        expect(result0).toEqual({
            from: 'getCount',
            count: 0,
        })

        expect(result1).toEqual({
            from: 'setCount',
            count: 10,
        })

        expect(result2).toEqual({
            from: 'getCount',
            count: 0,
        })
    })

    it('supports disable cache|batch|stream for each calling', async () => {
        let innerLoaderCallback = jest.fn()
        const innerLoader = createLoader((calling) => {
            innerLoaderCallback(calling)
            return loader.fetcher(calling)
        })

        const [result0, result1, result2] = await Promise.all([
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                cache: false,
            }),
            innerLoader({
                path: ['setCount'],
                input: {
                    newCount: 10,
                },
            }),
            innerLoader({
                path: ['getCount'],
                input: {},
            }),
        ])

        expect(innerLoaderCallback).lastCalledWith({
            type: 'Stream',
            callings: [
                {
                    type: 'Single',
                    path: ['getCount'],
                    input: {},
                },
                {
                    type: 'Single',
                    path: ['setCount'],
                    input: {
                        newCount: 10,
                    },
                },
                {
                    type: 'Single',
                    path: ['getCount'],
                    input: {},
                },
            ],
        })

        expect(result0).toEqual({
            from: 'getCount',
            count: 0,
        })

        expect(result1).toEqual({
            from: 'setCount',
            count: 10,
        })

        expect(result2).toEqual({
            from: 'getCount',
            count: 0,
        })

        innerLoaderCallback = jest.fn()
        const [result3, result4, result5] = await Promise.all([
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                stream: false,
                cache: false
            }),
            innerLoader({
                path: ['setCount'],
                input: {
                    newCount: 20,
                },
            }, {
                stream: false,
            }),
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                stream: false,
            }),
        ])

        expect(innerLoaderCallback).lastCalledWith({
            type: 'Batch',
            callings: [
                {
                    type: 'Single',
                    path: ['getCount'],
                    input: {},
                },
                {
                    type: 'Single',
                    path: ['setCount'],
                    input: {
                        newCount: 20,
                    },
                },
                {
                    type: 'Single',
                    path: ['getCount'],
                    input: {},
                },
            ],
        })

        expect(result3).toEqual({
            from: 'getCount',
            count: 10,
        })

        expect(result4).toEqual({
            from: 'setCount',
            count: 20,
        })

        expect(result5).toEqual({
            from: 'getCount',
            count: 10,
        })

        innerLoaderCallback = jest.fn()
        const results = await Promise.all([
            // should be single calling
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                batch: false,
            }),
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                batch: false,
            }),
            // should be batch calling
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                stream: false,
                cache: false
            }),
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                stream: false,
                cache: false
            }),
            // should be stream calling
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                cache: false
            }),
            innerLoader({
                path: ['getCount'],
                input: {},
            }, {
                cache: false
            }),
        ])

        expect(innerLoaderCallback).toHaveBeenNthCalledWith(1,
            {
                type: 'Single',
                path: ['getCount'],
                input: {},
            }
        )

        expect(innerLoaderCallback).toHaveBeenNthCalledWith(2,
            {
                type: 'Single',
                path: ['getCount'],
                input: {},
            }
        )

        expect(innerLoaderCallback).toHaveBeenNthCalledWith(3,
            {
                type: 'Batch',
                callings: [
                    {
                        type: 'Single',
                        path: ['getCount'],
                        input: {},
                    },
                    {
                        type: 'Single',
                        path: ['getCount'],
                        input: {},
                    },
                ],
            }
        )

        expect(innerLoaderCallback).toHaveBeenNthCalledWith(4,
            {
                type: 'Stream',
                callings: [
                    {
                        type: 'Single',
                        path: ['getCount'],
                        input: {},
                    },
                    {
                        type: 'Single',
                        path: ['getCount'],
                        input: {},
                    },
                ],
            }
        )

        expect(results).toEqual([
            {
                from: 'getCount',
                count: 20,
            },
            {
                from: 'getCount',
                count: 20,
            },
            {
                from: 'getCount',
                count: 20,
            },
            {
                from: 'getCount',
                count: 20,
            },
            {
                from: 'getCount',
                count: 20,
            },
            {
                from: 'getCount',
                count: 20,
            }
        ])
    })

    it('supports disable cache|batch|stream via options of createLoader', async () => {
        let innerLoaderCallback = jest.fn()
        // disable cache
        let innerLoader = createLoader((calling) => {
            innerLoaderCallback(calling)
            return loader.fetcher(calling)
        }, {
            cache: false,
        })

        const result0 = await Promise.all([
            innerLoader({
                path: ['getCount'],
                input: {},
            }),
            innerLoader({
                path: ['getCount'],
                input: {},
            }),
        ])

        expect(innerLoaderCallback).toBeCalledWith(
            {
                type: 'Stream',
                callings: [
                    {
                        type: 'Single',
                        path: ['getCount'],
                        input: {},
                    },
                    {
                        type: 'Single',
                        path: ['getCount'],
                        input: {},
                    }
                ]
            }
        )

        expect(result0).toEqual([
            {
                from: 'getCount',
                count: 0,
            },
            {
                from: 'getCount',
                count: 0,
            }
        ])

        innerLoaderCallback = jest.fn()
        // disable streaming
        innerLoader = createLoader((calling) => {
            innerLoaderCallback(calling)
            return loader.fetcher(calling)
        }, {
            cache: false,
            stream: false,
        })

        const result1 = await Promise.all([
            innerLoader({
                path: ['getCount'],
                input: {},
            }),
            innerLoader({
                path: ['getCount'],
                input: {},
            }),
        ])

        expect(innerLoaderCallback).toBeCalledWith(
            {
                type: 'Batch',
                callings: [
                    {
                        type: 'Single',
                        path: ['getCount'],
                        input: {},
                    },
                    {
                        type: 'Single',
                        path: ['getCount'],
                        input: {},
                    }
                ]
            }
        )

        expect(result1).toEqual([
            {
                from: 'getCount',
                count: 0,
            },
            {
                from: 'getCount',
                count: 0,
            }
        ])

        innerLoaderCallback = jest.fn()
        // disable batch
        innerLoader = createLoader((calling) => {
            innerLoaderCallback(calling)
            return loader.fetcher(calling)
        }, {
            batch: false,
        })

        const result2 = await Promise.all([
            innerLoader({
                path: ['getCount'],
                input: {},
            }),
            innerLoader({
                path: ['getCount'],
                input: {},
            }),
        ])

        expect(innerLoaderCallback).toHaveBeenNthCalledWith(1,
            {
                type: 'Single',
                path: ['getCount'],
                input: {},
            }
        )

        expect(innerLoaderCallback).toHaveBeenNthCalledWith(2,
            {
                type: 'Single',
                path: ['getCount'],
                input: {},
            }
        )

        expect(result2).toEqual([
            {
                from: 'getCount',
                count: 0,
            },
            {
                from: 'getCount',
                count: 0,
            }
        ])
    })

    it('supports custom scheduler', async () => {

        let innerLoaderCallback = jest.fn()
        let schedulerCallback = jest.fn()
        const innerLoader = createLoader((calling) => {
            innerLoaderCallback(calling)
            return loader.fetcher(calling)
        }, {
            cache: false,
            scheduler: (callback) => {
                schedulerCallback()
                setTimeout(callback, 1000)
            }
        })

        const runFn = jest.fn()

        const run = async () => {
            runFn()
            innerLoaderCallback = jest.fn()
            schedulerCallback = jest.fn()

            jest.useFakeTimers()

            const result0 = innerLoader({
                path: ['getCount'],
                input: {},
            })

            expect(innerLoaderCallback).toBeCalledTimes(0)
            expect(schedulerCallback).toBeCalledTimes(1)

            const result1 = innerLoader({
                path: ['getCount'],
                input: {},
            })

            expect(innerLoaderCallback).toBeCalledTimes(0)
            expect(schedulerCallback).toBeCalledTimes(1)

            jest.runOnlyPendingTimers()

            expect(innerLoaderCallback).toBeCalledWith({
                type: 'Stream',
                callings: [
                    {
                        type: 'Single',
                        path: ['getCount'],
                        input: {},
                    },
                    {
                        type: 'Single',
                        path: ['getCount'],
                        input: {},
                    }
                ]
            })

            expect(schedulerCallback).toBeCalledTimes(1)

            expect(await result0).toEqual({
                from: 'getCount',
                count: 0,
            })

            expect(await result1).toEqual({
                from: 'getCount',
                count: 0,
            })
        }

        await run()
        await run()

        expect(runFn).toBeCalledTimes(2)
    })

    it('should invoke single calling if only one calling', async () => {
        const innerLoaderCallback = jest.fn()
        const innerLoader = createLoader((calling) => {
            innerLoaderCallback(calling)
            return loader.fetcher(calling)
        })

        const result = await innerLoader({
            path: ['getCount'],
            input: {},
        })

        expect(innerLoaderCallback).toBeCalledWith({
            type: 'Single',
            path: ['getCount'],
            input: {},
        })

        expect(result).toEqual({
            from: 'getCount',
            count: 0,
        })
    })
})
