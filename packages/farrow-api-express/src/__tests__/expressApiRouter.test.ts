import request from 'supertest'
import express from 'express'
import { Int, ObjectType, Type } from 'farrow-schema'
import { Api } from 'farrow-api'
import { ApiRouter } from '../apiRouter'

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

const getCountError = Api(
  {
    input: {},
    output: CountState,
  },
  () => {
    return {
      count: false as any,
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

const apiRouter = ApiRouter()

apiRouter.use('/getCount', getCount)
apiRouter.use('/getCountError', getCountError)
apiRouter.post('/setCount', setCount)
apiRouter.use('/triggerError', triggerError)

const createServer = () => {
  const app = express()
  app.use(express.json())
  app.use(apiRouter.router)
  return app
}

describe('expressApiRotuer', () => {
  it('supports introspecting', async () => {
    const server = createServer()

    await request(server)
      .get('/__introspection__')
      .send()
      .expect(200, {
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
            type: 'Scalar',
            valueType: 'number',
            valueName: 'Int',
          },
          '3': { type: 'Struct', fields: {} },
          '4': {
            type: 'Struct',
            fields: {
              newCount: {
                typeId: 2,
                $ref: '#/types/2',
                description: 'new count value',
              },
            },
          },
          '5': {
            type: 'Struct',
            fields: {},
          },
          '6': {
            type: 'Struct',
            fields: {},
          },
        },
        entries: {
          type: 'Entries',
          entries: {
            '/getCount': {
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
            '/getCountError': {
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
            '/setCount': {
              type: 'Api',
              input: {
                typeId: 4,
                $ref: '#/types/4',
              },
              output: {
                typeId: 1,
                $ref: '#/types/1',
              },
            },
            '/triggerError': {
              type: 'Api',
              input: {
                typeId: 5,
                $ref: '#/types/5',
              },
              output: {
                typeId: 6,
                $ref: '#/types/6',
              },
            },
          },
        },
      })
  })

  it('supports calling api', async () => {
    const server = createServer()

    await request(server).get('/getCount').send({}).expect(200, {
      count: 0,
    })

    await request(server)
      .post('/setCount')
      .send({
        newCount: 10,
      })
      .expect(200, {
        count: 10,
      })

    await request(server).get('/getCount').send({}).expect(200, {
      count: 10,
    })
  })

  it('should 404 if api was not existed', async () => {
    const server = createServer()

    await request(server).post('/not_found').send({}).expect(404)
  })

  it('should response error if output is not valid', async () => {
    const server = createServer()

    await request(server)
      .post('/getCountError')
      .send({
        newCount: 1,
      })
      .expect(200, {
        code: -1,
        type: 'OutputValidationError',
        message: 'path: ["count"]\nfalse is not an integer',
      })
  })

  it('should response error if runtime had throw error', async () => {
    const server = createServer()

    await request(server).post('/triggerError').send({}).expect(200)
  })
})
