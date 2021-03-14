import request from 'supertest'
import { Http, HttpPipelineOptions, Response } from 'farrow-http'
import { cors } from '../index'

const createHttp = (options?: HttpPipelineOptions) => {
  return Http({
    logger: false,
    ...options,
  })
}

describe('farrow-cors', () => {
  it('supports static options', async () => {
    let http = createHttp()
    let server = http.server()

    http.use(
      cors({
        origin: 'http://example.com',
        methods: ['FOO', 'bar'],
        headers: ['FIZZ', 'buzz'],
        credentials: true,
        maxAge: 123,
      }),
    )

    http.post('/test').use((request) => {
      return Response.json(request)
    })

    await request(server)
      .options('/test')
      .set({
        origin: 'http://example.com',
        'access-control-request-headers': 'x-header-1, x-header-2',
      })
      .expect('Access-Control-Allow-Origin', 'http://example.com')
      .expect('Access-Control-Allow-Methods', 'FOO,bar')
      .expect('Access-Control-Allow-Headers', 'FIZZ,buzz')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect('Access-Control-Max-Age', '123')
  })

  it('should support function option', async () => {
    let http = createHttp()
    let server = http.server()

    http.use(
      cors((request, callback) => {
        callback(null, {
          origin: request.headers['origin'],
          methods: ['FOO', 'bar'],
          headers: ['FIZZ', 'buzz'],
          credentials: true,
          maxAge: 123,
        })
      }),
    )

    http.post('/test').use((request) => {
      return Response.json(request)
    })

    await request(server)
      .options('/test')
      .set({
        origin: 'http://example.com',
        'access-control-request-headers': 'x-header-1, x-header-2',
      })
      .expect('Access-Control-Allow-Origin', 'http://example.com')
      .expect('Access-Control-Allow-Methods', 'FOO,bar')
      .expect('Access-Control-Allow-Headers', 'FIZZ,buzz')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect('Access-Control-Max-Age', '123')
  })
})
