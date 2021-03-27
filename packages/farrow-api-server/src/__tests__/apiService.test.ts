import request from 'supertest'
import { Int, ObjectType, Type } from 'farrow-schema'
import { Http, HttpPipelineOptions } from 'farrow-http'
import { Api } from 'farrow-api'
import { ApiService } from '../apiService'

const createHttp = (options?: HttpPipelineOptions) => {
  return Http({
    logger: false,
    ...options,
  })
}

class CountState extends ObjectType {
  count = {
    description: 'count of counter',
    [Type]: Int,
  }
}

let count = 0

const getCount = Api(
  {
    input: {},
    output: CountState,
  },
  () => {
    return {
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
    output: CountState,
  },
  (input) => {
    count = input.newCount
    return getCount({})
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

describe('ApiService', () => {
  beforeEach(() => {
    /**
     * reset count
     */
    count = 0
  })

  it('supports introspecting', async () => {
    let http = createHttp()
    let server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
        type: 'Introspection',
      })
      // .expect((res) => {
      //   console.log('res', JSON.stringify(res.body, null, 2))
      // })
      .expect(200, {
        type: 'ApiSuccessResponse',
        output: {
          protocol: 'Farrow-API',
          types: {
            '0': {
              type: 'Struct',
              fields: {},
            },
            '1': {
              type: 'Object',
              name: 'CountState',
              fields: {
                count: {
                  typeId: 2,
                  $ref: '#/types/2',
                  description: 'count of counter',
                },
              },
            },
            '2': {
              type: 'Int',
            },
            '3': {
              type: 'Struct',
              fields: {
                newCount: {
                  typeId: 2,
                  $ref: '#/types/2',
                  description: 'new count value',
                },
              },
            },
            '4': {
              type: 'Struct',
              fields: {},
            },
            '5': {
              type: 'Struct',
              fields: {},
            },
          },
          entries: {
            type: 'Entries',
            entries: {
              getCount: {
                type: 'Api',
                input: {
                  typeId: 0,
                  $ref: '#/types/0',
                },
                output: {
                  typeId: 1,
                  $ref: '#/types/1',
                },
              },
              setCount: {
                type: 'Api',
                input: {
                  typeId: 3,
                  $ref: '#/types/3',
                },
                output: {
                  typeId: 1,
                  $ref: '#/types/1',
                },
              },
              triggerError: {
                type: 'Api',
                input: {
                  typeId: 4,
                  $ref: '#/types/4',
                },
                output: {
                  typeId: 5,
                  $ref: '#/types/5',
                },
              },
            },
          },
        },
      })
  })

  it('supports calling api', async () => {
    let http = createHttp()
    let server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
        path: ['getCount'],
        input: {},
      })
      .expect(200, {
        type: 'ApiSuccessResponse',
        output: {
          count: 0,
        },
      })

    await request(server)
      .post('/counter')
      .send({
        path: ['setCount'],
        input: {
          newCount: 10,
        },
      })
      .expect(200, {
        type: 'ApiSuccessResponse',
        output: {
          count: 10,
        },
      })

    await request(server)
      .post('/counter')
      .send({
        path: ['getCount'],
        input: {},
      })
      .expect(200, {
        type: 'ApiSuccessResponse',
        output: {
          count: 10,
        },
      })
  })

  it('should response error if api throwed', async () => {
    let http = createHttp()
    let server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
        path: ['triggerError'],
        input: {},
      })
      .expect(200, {
        type: 'ApiErrorResponse',
        error: {
          message: 'trigger error',
        },
      })
  })

  it('should response error if api was not existed', async () => {
    let http = createHttp()
    let server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
        path: ['nonExisted'],
        input: {},
      })
      .expect(200, {
        type: 'ApiErrorResponse',
        error: {
          message: 'The target API was not found with the path: [nonExisted]',
        },
      })
  })

  it('should response error if input is not valid', async () => {
    let http = createHttp()
    let server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
        path: ['setCount'],
        input: {
          newCount: false,
        },
      })
      .expect(200, {
        type: 'ApiErrorResponse',
        error: {
          message: 'path: ["newCount"]\nfalse is not an integer',
        },
      })
  })

  it('supports batch calling api', async () => {
    let http = createHttp()
    let server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
        type: 'Batch',
        callings: [
          {
            path: ['getCount'],
            input: {},
          },
          {
            path: ['setCount'],
            input: {
              newCount: 10,
            },
          },
          {
            path: ['getCount'],
            input: {},
          },
        ],
      })
      .expect(200, {
        type: 'Batch',
        result: [
          {
            type: 'ApiSuccessResponse',
            output: {
              count: 0,
            },
          },
          {
            type: 'ApiSuccessResponse',
            output: {
              count: 10,
            },
          },
          {
            type: 'ApiSuccessResponse',
            output: {
              count: 10,
            },
          },
        ],
      })
  })
})
