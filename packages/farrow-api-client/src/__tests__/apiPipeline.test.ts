import { apiPipeline } from '../index'
import './route'

describe('ApiPipeline', () => {
  it('can attach extra body/headers/response fields', async () => {
    let result = await apiPipeline.run({
      url: '/use/success',
      calling: {
        type: 'Single' as const,
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
            type: 'Single',
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
      calling: {
        type: 'Single' as const,
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
            type: 'Single',
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
      calling: {
        type: 'Single' as const,
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
            type: 'Single',
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
      calling: {
        type: 'Single' as const,
        path: [],
        input: {},
      },
    }
    let result0 = await apiPipeline.run(request0)

    let request1 = {
      url: '/regexp/error',
      calling: {
        type: 'Single' as const,
        path: [],
        input: {},
      },
    }
    let result1 = await apiPipeline.run(request1)

    let request2 = {
      url: '/non-existed',
      calling: {
        type: 'Single' as const,
        path: [],
        input: {},
      },
    }
    let result2 = await apiPipeline.run(request2)

    expect(result0).toEqual({
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

    expect(await apiPipeline.invoke(request0.url, request0.calling)).toBeInstanceOf(Error)

    expect(await apiPipeline.invoke(request1.url, request1.calling)).toBeInstanceOf(Error)

    expect(await apiPipeline.invoke(request2.url, request2.calling)).toBeInstanceOf(Error)
  })

  it('can send batch request', async () => {
    let result = await apiPipeline.run({
      url: '/use/success',
      calling: {
        type: 'Batch',
        callings: [
          {
            type: 'Single',
            path: ['a'],
            input: {
              b: 1,
            },
          },
          {
            type: 'Single',
            path: ['a'],
            input: {
              b: 2,
            },
          },
          {
            type: 'Single',
            path: ['a'],
            input: {
              b: 3,
            },
          },
        ],
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
            type: 'Batch',
            callings: [
              {
                type: 'Single',
                path: ['a'],
                input: {
                  b: 1,
                },
              },
              {
                type: 'Single',
                path: ['a'],
                input: {
                  b: 2,
                },
              },
              {
                type: 'Single',
                path: ['a'],
                input: {
                  b: 3,
                },
              },
            ],
          },
          headers: {
            'from-use-for-header': '1',
          },
        },
        a: 1,
      },
    })
  })
})
