import { ApiError, ApiSuccess, isApiError, isApiSuccess } from 'farrow-api-server'
import { createApiPipeline, apiPipeline } from '../index'

apiPipeline.use(async (request, next) => {
  let body = {
    ...request.body,
    fromUseForBody: true,
  }

  let options: RequestInit = {
    ...request.options,
    headers: {
      ...request.options?.headers,
      'from-use-for-header': '1',
    },
  }

  let response = await next({
    ...request,
    body,
    options,
  })

  return {
    ...response,
    fromUseForResponse: true,
  }
})

apiPipeline.match('/match', async (request, next) => {
  let body = {
    ...request.body,
    fromMatchStringForBody: true,
  }

  let options: RequestInit = {
    ...request.options,
    headers: {
      ...request.options?.headers,
      'from-match-string-for-header': '1',
    },
  }

  let response = await next({
    ...request,
    body,
    options,
  })

  return {
    ...response,
    fromMatchStringForResponse: true,
  }
})

apiPipeline.match(/regexp/i, async (request, next) => {
  let body = {
    ...request.body,
    fromMatchRegexpForBody: true,
  }

  let options: RequestInit = {
    ...request.options,
    headers: {
      ...request.options?.headers,
      'from-match-regexp-for-header': '1',
    },
  }

  let response = await next({
    ...request,
    body,
    options,
  })

  return {
    ...response,
    fromMatchRegexpForResponse: true,
  }
})

apiPipeline.use(async (input) => {
  let data = {
    url: input.url,
    body: input.body,
    headers: input.options?.headers as Record<string, string>,
  }

  if (input.url === '/use/success') {
    return ApiSuccess({ data, a: 1 })
  }

  if (input.url === '/match/success') {
    return ApiSuccess({ data, a: 1 })
  }

  if (input.url === '/match/error') {
    return ApiError('/match/error')
  }

  if (input.url === '/regexp/success') {
    return ApiSuccess({
      data,
      b: 1,
    })
  }

  if (input.url === '/regexp/error') {
    return ApiError('/regexp/error')
  }

  return ApiError('handler not found')
})

describe('farrow-api-client', () => {
  it('can attach extra body/headers/response fields', async () => {
    let result = await apiPipeline.run({
      url: '/use/success',
      body: {
        path: ['a'],
        input: {
          b: 1,
        },
      },
    })

    expect(result).toEqual({
      type: 'ApiSuccessResponse',
      fromUseForResponse: true,
      output: {
        data: {
          url: '/use/success',
          body: {
            fromUseForBody: true,
            path: ['a'],
            input: {
              b: 1,
            },
          },
          headers: {
            'from-use-for-header': '1',
          },
        },
        a: 1,
      },
    })
  })

  it('can attach extra body/headers/response fields via .match(string)', async () => {
    let result = await apiPipeline.run({
      url: '/match/success',
      body: {
        path: ['a'],
        input: {
          b: 1,
        },
      },
    })

    expect(result).toEqual({
      type: 'ApiSuccessResponse',
      fromUseForResponse: true,
      fromMatchStringForResponse: true,
      output: {
        data: {
          url: '/match/success',
          body: {
            fromUseForBody: true,
            fromMatchStringForBody: true,
            path: ['a'],
            input: {
              b: 1,
            },
          },
          headers: {
            'from-use-for-header': '1',
            'from-match-string-for-header': '1',
          },
        },
        a: 1,
      },
    })
  })

  it('can attach extra body/headers/response fields via .match(regexp)', async () => {
    let result = await apiPipeline.run({
      url: '/regexp/success',
      body: {
        path: ['a'],
        input: {
          b: 1,
        },
      },
    })

    expect(result).toEqual({
      type: 'ApiSuccessResponse',
      fromUseForResponse: true,
      fromMatchRegexpForResponse: true,
      output: {
        data: {
          url: '/regexp/success',
          body: {
            fromUseForBody: true,
            fromMatchRegexpForBody: true,
            path: ['a'],
            input: {
              b: 1,
            },
          },
          headers: {
            'from-use-for-header': '1',
            'from-match-regexp-for-header': '1',
          },
        },
        b: 1,
      },
    })
  })

  it('may response error', async () => {
    let request0 = {
      url: '/match/error',
      body: {
        path: [],
        input: {},
      },
    }
    let result0 = await apiPipeline.run(request0)

    let request1 = {
      url: '/regexp/error',
      body: {
        path: [],
        input: {},
      },
    }
    let result1 = await apiPipeline.run(request1)

    let request2 = {
      url: '/non-existed',
      body: {
        path: [],
        input: {},
      },
    }
    let result2 = await apiPipeline.run(request2)

    expect(result0).toEqual({
      fromMatchStringForResponse: true,
      fromUseForResponse: true,
      type: 'ApiErrorResponse',
      error: {
        message: '/match/error',
      },
    })

    expect(result1).toEqual({
      fromMatchRegexpForResponse: true,
      fromUseForResponse: true,
      type: 'ApiErrorResponse',
      error: {
        message: '/regexp/error',
      },
    })

    expect(result2).toEqual({
      fromUseForResponse: true,
      type: 'ApiErrorResponse',
      error: {
        message: 'handler not found',
      },
    })

    await expect(async () => {
      await apiPipeline.invoke(request0.url, request0.body)
    }).rejects.toThrow('/match/error')

    await expect(async () => {
      await apiPipeline.invoke(request1.url, request1.body)
    }).rejects.toThrow('/regexp/error')

    await expect(async () => {
      await apiPipeline.invoke(request2.url, request2.body)
    }).rejects.toThrow('handler not found')
  })
})
