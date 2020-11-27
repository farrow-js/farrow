import request from 'supertest'

import fs from 'fs'
import { Stream } from 'stream'

import { Http, HttpPipelineOptions, Router, Response } from '../'
import path from 'path'

const createHttp = (options?: HttpPipelineOptions) => {
  return Http({
    logger: false,
    ...options,
  })
}

describe('Http', () => {
  it('support text response', async () => {
    let http = createHttp()

    http
      .match({
        pathname: '/test',
      })
      .use((data) => {
        return Response.text(JSON.stringify(data))
      })

    await request(http.server())
      .get('/test')
      .expect('Content-Type', /text/)
      .expect(
        'Content-Length',
        JSON.stringify({
          pathname: '/test',
        }).length.toString(),
      )
      .expect(
        200,
        JSON.stringify({
          pathname: '/test',
        }),
      )
  })

  it('support html response', async () => {
    let http = createHttp()

    http
      .match({
        pathname: '/test',
      })
      .use((data) => {
        return Response.html(JSON.stringify(data))
      })

    await request(http.server())
      .get('/test')
      .expect('Content-Type', /html/)
      .expect(
        'Content-Length',
        JSON.stringify({
          pathname: '/test',
        }).length.toString(),
      )
      .expect(
        200,
        JSON.stringify({
          pathname: '/test',
        }),
      )
  })

  it('support json response', async () => {
    let http = createHttp()

    http
      .match({
        pathname: '/test',
      })
      .use((data) => {
        return Response.json(data)
      })

    await request(http.server())
      .get('/test')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, {
        pathname: '/test',
      })
  })

  it('support empty response', async () => {
    let http = createHttp()

    http
      .match({
        pathname: '/test',
      })
      .use(() => {
        return Response.empty()
      })

    await request(http.server()).get('/test').set('Accept', 'text/plain').expect('Content-Type', /text/).expect(204, '')
  })

  it('support redirecting', async () => {
    let http = createHttp()

    http
      .match({
        pathname: '/test',
      })
      .use(() => {
        return Response.redirect('/redirected')
      })

    await request(http.server()).get('/test').expect('Location', '/redirected').expect(302)
  })

  it('support stream response', async () => {
    let http = createHttp()

    http
      .match({
        pathname: '/test',
      })
      .use(() => {
        let stream = new Stream.Readable({
          read() {
            this.push('test stream')
            this.push(null)
          },
        })
        return Response.stream(stream)
      })

    await request(http.server()).get('/test').expect(200, 'test stream')
  })

  it('support buffer response', async () => {
    let http = createHttp()

    http
      .match({
        pathname: '/test',
      })
      .use(() => {
        return Response.buffer(Buffer.from('test buffer'))
      })

    await request(http.server()).get('/test').expect(200, 'test buffer')
  })

  it('support buffer response', async () => {
    let http = createHttp()

    http
      .match({
        pathname: '/test',
      })
      .use(() => {
        return Response.buffer(Buffer.from('test buffer'))
      })

    await request(http.server()).get('/test').expect(200, 'test buffer')
  })

  it('support file response', async () => {
    let http = createHttp()

    let filename = path.join(__dirname, 'http.test.ts')

    let content = await fs.promises.readFile(filename)

    http
      .match({
        pathname: '/test',
      })
      .use(() => {
        return Response.file(filename)
      })

    await request(http.server()).get('/test').expect(200, content)
  })

  it('support raw response', async () => {
    let http = createHttp()

    http
      .match({
        pathname: '/test',
      })
      .use(() => {
        return Response.raw('test raw body')
      })

    await request(http.server()).get('/test').expect(200, 'test raw body')
  })

  it('support custom response', async () => {
    let http = createHttp()

    http
      .match({
        pathname: '/test',
      })
      .use(() => {
        return Response.custom(({ req, res, requestInfo, responseInfo }) => {
          res.end(
            JSON.stringify({
              requestInfo: {
                ...requestInfo,
                headers: null,
              },
              responseInfo,
            }),
          )
        })
      })

    await request(http.server())
      .get('/test')
      .expect(
        200,
        JSON.stringify({
          requestInfo: {
            pathname: '/test',
            method: 'GET',
            query: {},
            body: null,
            headers: null,
            cookies: {},
          },
          responseInfo: {},
        }),
      )
  })

  it('should not be matched when pathname or method failed to match', async () => {
    let http = createHttp()
    let server = http.server()

    http
      .match({
        pathname: '/test',
        method: 'POST',
      })
      .use((request) => {
        return Response.json(request)
      })

    await request(server).get('/test').expect(404)
    await request(server).post('/test0').expect(404)
    await request(server).post('/test').expect(200, {
      pathname: '/test',
      method: 'POST',
    })
  })

  it('should throw error when there are no middlewares handling request', async () => {
    let http = createHttp()

    http.match({
      pathname: '/test',
    })

    await request(http.server()).get('/test').expect(500)
  })

  it('support set response headers', async () => {})
})
