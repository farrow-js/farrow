import request from 'supertest'
import { Int, Literal, ObjectType, Type } from 'farrow-schema'
import { Http, HttpPipelineOptions } from 'farrow-http'
import { Api } from 'farrow-api'
import fetch from 'node-fetch'
import { ApiService } from '../src/apiService'

let portUid = 3000

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

describe('ApiService', () => {
  beforeEach(() => {
    /**
     * reset count
     */
    count = 0
  })

  it('supports introspecting', async () => {
    const http = createHttp()
    const server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .get('/counter/__introspection__')
      // .expect((res) => {
      //   console.log('res', JSON.stringify(res.body, null, 2))
      // })
      .expect(200, {
        protocol: 'Farrow-API',
        types: {
          '0': {
            type: 'Struct',
            fields: {},
          },
          '1': {
            type: 'Struct',
            fields: {
              from: {
                typeId: 2,
                $ref: '#/types/2',
                description: 'from',
              },
              count: {
                typeId: 3,
                $ref: '#/types/3',
                description: 'count of counter',
              },
            },
          },
          '2': {
            type: 'Literal',
            value: 'getCount',
          },
          '3': {
            type: 'Scalar',
            valueType: 'number',
            valueName: 'Int',
          },
          '4': {
            type: 'Struct',
            fields: {
              newCount: {
                typeId: 3,
                $ref: '#/types/3',
                description: 'new count value',
              },
            },
          },
          '5': {
            type: 'Struct',
            fields: {
              from: {
                typeId: 6,
                $ref: '#/types/6',
                description: 'from',
              },
              count: {
                typeId: 3,
                $ref: '#/types/3',
                description: 'count of counter',
              },
            },
          },
          '6': {
            type: 'Literal',
            value: 'setCount',
          },
          '7': {
            type: 'Struct',
            fields: {},
          },
          '8': {
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
                typeId: 4,
                $ref: '#/types/4',
              },
              output: {
                typeId: 5,
                $ref: '#/types/5',
              },
            },
            triggerError: {
              type: 'Api',
              input: {
                typeId: 7,
                $ref: '#/types/7',
              },
              output: {
                typeId: 8,
                $ref: '#/types/8',
              },
            },
          },
        },
      })
  })

  it('supports introspecting optional', async () => {
    const http = createHttp()
    const server = http.server()

    http.route('/counter').use(
      ApiService({
        entries,
        errorStack: false,
        introspection: false,
      }),
    )

    await request(server).get('/counter/__introspection__').expect(404)
  })

  it('supports calling api', async () => {
    const http = createHttp()
    const server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
        type: 'Single',
        path: ['getCount'],
        input: {},
      })
      .expect(200, {
        type: 'ApiSingleSuccessResponse',
        output: {
          from: 'getCount',
          count: 0,
        },
      })

    await request(server)
      .post('/counter')
      .send({
        type: 'Single',
        path: ['setCount'],
        input: {
          newCount: 10,
        },
      })
      .expect(200, {
        type: 'ApiSingleSuccessResponse',
        output: {
          from: 'setCount',
          count: 10,
        },
      })

    await request(server)
      .post('/counter')
      .send({
        type: 'Single',
        path: ['getCount'],
        input: {},
      })
      .expect(200, {
        type: 'ApiSingleSuccessResponse',
        output: {
          from: 'getCount',
          count: 10,
        },
      })
  })

  it('should response error if api thrown', async () => {
    const http = createHttp()
    const server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
        type: 'Single',
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
    const http = createHttp()
    const server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
        type: 'Single',
        path: ['nonExisted'],
        input: {},
      })
      .expect(200, {
        type: 'ApiErrorResponse',
        error: {
          message: 'The target API was not found with the path: ["nonExisted"]',
        },
      })
  })

  it('should response error if input is not valid', async () => {
    const http = createHttp()
    const server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
        type: 'Single',
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
    const http = createHttp()
    const server = http.server()

    http.route('/counter').use(CounterService)

    await request(server)
      .post('/counter')
      .send({
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
          },
          {
            type: 'Single',
            path: ['getCount'],
            input: {},
          },
        ],
      })
      .expect(200, {
        type: 'ApiBatchSuccessResponse',
        result: [
          {
            type: 'ApiSingleSuccessResponse',
            output: {
              from: 'getCount',
              count: 0,
            },
          },
          {
            type: 'ApiSingleSuccessResponse',
            output: {
              from: 'setCount',
              count: 10,
            },
          },
          {
            type: 'ApiSingleSuccessResponse',
            output: {
              from: 'getCount',
              count: 0,
            },
          },
        ],
      })
  })

  it('supports streaming batch calling api', async () => {
    const http = createHttp()
    const server = http.server()
    const port = portUid++
    const url = `http://localhost:${port}/counter`

    http.route('/counter').use(CounterService)

    await new Promise<void>((resolve) => {
      server.listen(port, resolve)
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    })

    if (!response.body) {
      throw new Error('response body is not readable')
    }

    const text = await response.text()

    expect(text).toBe(
      [
        {
          type: 'ApiSingleSuccessResponse',
          output: {
            from: 'getCount',
            count: 0,
          },
          index: 0,
        },
        {
          type: 'ApiSingleSuccessResponse',
          output: {
            from: 'getCount',
            count: 0,
          },
          index: 2,
        },
        {
          type: 'ApiSingleSuccessResponse',
          output: {
            from: 'setCount',
            count: 10,
          },
          index: 1,
        },
      ]
        .map((item) => JSON.stringify(item) + '\n')
        .join(''),
    )

    await new Promise((resolve) => {
      server.close(resolve)
    })
  })

  it('supports disable streaming batch calling api', async () => {
    const http = createHttp()
    const server = http.server()
    const port = portUid++
    const url = `http://localhost:${port}/counter`

    const CounterService = ApiService({
      entries,
      errorStack: false,
      stream: false,
    })

    http.route('/counter').use(CounterService)

    await new Promise<void>((resolve) => {
      server.listen(port, resolve)
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    })

    if (!response.body) {
      throw new Error('response body is not readable')
    }

    const text = await response.text()

    expect(text).toBe(
      [
        {
          type: 'ApiSingleSuccessResponse',
          output: {
            from: 'getCount',
            count: 0,
          },
          index: 0,
        },
        {
          type: 'ApiSingleSuccessResponse',
          output: {
            from: 'getCount',
            count: 0,
          },
          index: 2,
        },
        {
          type: 'ApiSingleSuccessResponse',
          output: {
            from: 'setCount',
            count: 10,
          },
          index: 1,
        },
      ]
        .map((item) => JSON.stringify(item) + '\n')
        .join(''),
    )

    await new Promise((resolve) => {
      server.close(resolve)
    })
  })

  it('supports subscribe onSuccess/onError event for every single calling', async () => {
    const http = createHttp()
    const server = http.server()
    const port = portUid++
    const url = `http://localhost:${port}/counter`

    const onSuccess = jest.fn()
    const onError = jest.fn()

    const CounterService = ApiService({
      entries,
      errorStack: false,
      stream: false,
      onSuccess,
      onError
    })


    http.route('/counter').use(CounterService)

    await new Promise<void>((resolve) => {
      server.listen(port, resolve)
    })

    // success
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'Single',
        path: ['getCount'],
        input: {},
      })
    })

    expect(onSuccess).toBeCalledWith({
      type: 'Single',
      path: ['getCount'],
      input: {},
    }, {
      from: 'getCount',
      count: 0,
    })
    expect(onError).toBeCalledTimes(0)

    // trigger error in api
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'Single',
        path: ['triggerError'],
        input: {},
      })
    })

    expect(onSuccess).toBeCalledTimes(1)
    expect(onError).toBeCalledWith({
      type: 'Single',
      path: ['triggerError'],
      input: {},
    }, 'trigger error')

    // trigger error when args is not valid
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'Single',
        path: ['setCount'],
        input: {
          newCount: false,
        },
      })
    })

    expect(onSuccess).toBeCalledTimes(1)
    expect(onError).toBeCalledWith({
      type: 'Single',
      path: ['setCount'],
      input: {
        newCount: false,
      },
    }, 'path: ["newCount"]\nfalse is not an integer')

    // trigger error when api is not existed
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'Single',
        path: ['nonExisted'],
        input: {},
      })
    })

    expect(onSuccess).toBeCalledTimes(1)
    expect(onError).toBeCalledWith({
      type: 'Single',
      path: ['nonExisted'],
      input: {},
    }, 'The target API was not found with the path: ["nonExisted"]')



    // success on batch callings
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
          },
          {
            type: 'Single',
            path: ['getCount'],
            input: {},
          },
        ],
      })

    })

    expect(onSuccess).toBeCalledTimes(4)

    await new Promise((resolve) => {
      server.close(resolve)
    })
  })
})
