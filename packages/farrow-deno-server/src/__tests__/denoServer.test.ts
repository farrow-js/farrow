import fs from 'fs'
import { agent } from 'supertest'
import { Int, ObjectType, Type } from 'farrow-schema'
import { Http, HttpPipelineOptions } from 'farrow-http'
import { Api } from 'farrow-api'
import { DenoService } from '../index'

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

const CounterService = DenoService({
  entries,
})

describe('deno-server', () => {
  it('client in server services', async () => {
    const http = createHttp()

    http.route('/counter').use(CounterService)

    const server = http.listen(3000)

    const source = fs.readFileSync(`${__dirname}/client.ts`, 'utf-8')

    const test = await agent(server).get('/counter/client.ts').send()

    server.close()

    expect(JSON.stringify(test.text)).toBe(JSON.stringify(source))
  })
})
