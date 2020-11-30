import request from 'supertest'

import fs from 'fs'
import { Stream } from 'stream'

import { Http, HttpPipelineOptions, Router, Response, useRequestInfo, useReq, useRes } from '../'
import path from 'path'

const delay = (time: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

const createHttp = (options?: HttpPipelineOptions) => {
  return Http({
    logger: false,
    ...options,
  })
}

describe('Http', () => {
  describe('Response', () => {
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

      await request(http.server())
        .get('/test')
        .set('Accept', 'text/plain')
        .expect('Content-Type', /text/)
        .expect(204, '')
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

    it('should responding 500 when there are no middlewares handling request', async () => {
      let http = createHttp()

      http.match({
        pathname: '/test',
      })

      await request(http.server()).get('/test').expect(500)
    })

    it('should responding 500 when middleware throwed error', async () => {
      let http = createHttp()

      http.use((request, next) => {
        if (request.pathname === '/sync') {
          throw new Error('sync error')
        }
        return next()
      })

      http.use(async (request, next) => {
        if (request.pathname === '/async') {
          await delay(10)
          throw new Error('async error')
        }
        return next()
      })

      http.use(() => {
        return Response.json({
          ok: true,
        })
      })

      await request(http.server()).get('/sync').expect(500)
      await request(http.server()).get('/async').expect(500)
      await request(http.server()).get('/').expect(200, {
        ok: true,
      })
    })

    it('support set response status', async () => {
      let http = createHttp()
      let server = http.server()

      http
        .match({
          pathname: '/test-status',
        })
        .use(() => {
          return Response.status(302, 'abc').text('ok')
        })

      await request(server).get('/test-status').expect(302)
    })

    it('support set response headers', async () => {
      let http = createHttp()
      let server = http.server()

      http
        .match({
          pathname: '/test-header',
        })
        .use(() => {
          return Response.header('test-header', 'header-value').text('ok')
        })

      http
        .match({
          pathname: '/test-headers',
        })
        .use(() => {
          return Response.headers({
            'test-header1': 'header1-value',
            'test-header2': 'header2-value',
          }).text('ok')
        })

      await request(server).get('/test-header').expect('test-header', 'header-value').expect(200)
      await request(server)
        .get('/test-headers')
        .expect('test-header1', 'header1-value')
        .expect('test-header2', 'header2-value')
        .expect(200)
    })

    it('support set response cookies', async () => {
      let http = createHttp()
      let server = http.server()

      http
        .match({
          pathname: '/test-cookie',
          method: 'POST',
        })
        .use(() => {
          return Response.cookie('test-cookie', 'cookie-value').text('set cookie ok')
        })

      http
        .match({
          pathname: '/test-cookies',
          method: 'POST',
        })
        .use(() => {
          return Response.cookies({
            'test-cookie1': 'cookie1-value',
            'test-cookie2': 'cookie2-value',
          }).text('set cookies ok')
        })

      await request(server)
        .post('/test-cookie')
        .expect('set-cookie', 'test-cookie=cookie-value; path=/; httponly')
        .expect(200, 'set cookie ok')

      await request(server)
        .post('/test-cookies')
        .expect(
          'set-cookie',
          ['test-cookie1=cookie1-value; path=/; httponly', 'test-cookie2=cookie2-value; path=/; httponly'].join(','),
        )
        .expect(200, 'set cookies ok')
    })

    it('support set response vary', async () => {
      let http = createHttp()
      let server = http.server()

      http
        .match({
          pathname: '/test-vary',
        })
        .use(() => {
          return Response.vary('origin', 'cookie').text('ok')
        })

      await request(server).get('/test-vary').expect('vary', 'origin, cookie').expect(200, 'ok')
    })

    it('support set attachment', async () => {
      let http = createHttp()
      let server = http.server()

      http
        .match({
          pathname: '/test-vary',
        })
        .use(() => {
          return Response.attachment('test.txt').text('ok')
        })

      await request(server)
        .get('/test-vary')
        .expect('content-disposition', 'attachment; filename="test.txt"')
        .expect(200, 'ok')
    })

    it('support set content-type via mime-type', async () => {
      let http = createHttp()
      let server = http.server()

      http
        .match({
          pathname: '/test-type',
          method: 'POST',
          body: {
            type: String,
          },
        })
        .use((request) => {
          return Response.type(request.body.type).buffer(
            Buffer.from(
              JSON.stringify({
                success: true,
                data: request.body,
              }),
            ),
          )
        })

      await request(server)
        .post('/test-type')
        .send({
          type: 'png',
        })
        .expect('Content-Type', 'image/png')

      await request(server)
        .post('/test-type')
        .send({
          type: 'jpg',
        })
        .expect('Content-Type', 'image/jpeg')

      await request(server)
        .post('/test-type')
        .send({
          type: 'file.js',
        })
        .expect('Content-Type', 'application/javascript; charset=utf-8')

      await request(server)
        .post('/test-type')
        .send({
          type: 'file.html',
        })
        .expect('Content-Type', 'text/html; charset=utf-8')

      await request(server)
        .post('/test-type')
        .send({
          type: 'file.css',
        })
        .expect('Content-Type', 'text/css; charset=utf-8')

      await request(server)
        .post('/test-type')
        .send({
          type: 'file.json',
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
    })
  })

  describe('Request', () => {
    it('support access native req/res via useReq/useRes', async () => {
      let http = createHttp()

      http.use(() => {
        let req = useReq()
        let res = useRes()

        res.statusCode = 200
        res.end(req.url)

        return Response.custom()
      })

      await request(http.server()).get('/test-abc').expect(200, '/test-abc')
    })

    it('support access request info via useRequestInfo', async () => {
      let http = createHttp()

      http.use(() => {
        let info = useRequestInfo()
        return Response.json({
          ...info,
          headers: {
            cookie: info.headers?.cookie,
            'content-type': 'application/json',
            accept: 'application/json',
            'content-length': '13',
          },
        })
      })

      await request(http.server())
        .post('/test-abc?a=1&b=2')
        .set('Accept', 'application/json')
        .set('Cookie', ['nameOne=valueOne;nameTwo=valueTwo'])
        .send({
          a: 1,
          b: 2,
        })
        .expect(200, {
          pathname: '/test-abc',
          method: 'POST',
          query: { a: '1', b: '2' },
          body: { a: 1, b: 2 },
          headers: {
            accept: 'application/json',
            cookie: 'nameOne=valueOne;nameTwo=valueTwo',
            'content-type': 'application/json',
            'content-length': '13',
          },
          cookies: { nameOne: 'valueOne', nameTwo: 'valueTwo' },
        })
    })
  })
})
