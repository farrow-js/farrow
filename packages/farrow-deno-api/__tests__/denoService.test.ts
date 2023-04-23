import fs from 'fs'
import fetch from 'node-fetch'
import { agent } from 'supertest'
import { Int, ObjectType, Type } from 'farrow-schema'
import { Http, HttpPipelineOptions } from 'farrow-http'
import { Api } from 'farrow-api'
import { DenoService } from '../src/index'
import { api } from './client'

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

describe('deno-api', () => {
  it('client in server services', async () => {
    const http = createHttp()

    http.route('/counter').use(CounterService)

    const server = http.listen(3000)

    const source = fs.readFileSync(`${__dirname}/client.ts`, 'utf-8')

    const test = await agent(server).get('/counter/client.ts').send()

    fs.writeFileSync(`${__dirname}/client.ts`, test.text)

    server.close()

    expect(test.text.replace(/\r|\n/g, '')).toBe(source.replace(/\r|\n/g, ''))
  })

  it('should work', async () => {
    global.fetch = fetch as any
    const http = createHttp()

    http.route('/counter').use(CounterService)

    const server = http.listen(3000)

    expect(await api.getCount({})).toStrictEqual({ count: 0 })

    expect(await api.setCount({ newCount: 1 })).toStrictEqual({ count: 1 })

    expect(await api.getCount({})).toStrictEqual({ count: 1 })

    server.close()
  })
})
