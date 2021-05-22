import React from 'react'

import { Http, Router } from 'farrow-http'
import request from 'supertest'
import { useReactView } from '../index'
import { Link } from '../Link'

const createHttp = () => {
  return Http({
    logger: false,
  })
}

describe('Farrow-React', () => {
  it('should rendering react component', async () => {
    const http = createHttp()
    const server = http.server()

    http
      .match({
        pathname: '/test-react',
        query: {
          a: Number,
          b: String,
          c: Boolean,
        },
      })
      .use((request) => {
        const ReactView = useReactView()

        return ReactView.render(
          <div data-a={request.query.a} data-b={request.query.b} data-c={request.query.c}>
            react view
          </div>,
        )
      })

    await request(server)
      .get('/test-react?a=1&b=abc&c=true')
      .expect('Content-Type', /html/)
      .expect(200, '<!doctype html>\n<div data-a="1" data-b="abc" data-c="true">react view</div>')

    await request(server)
      .get('/test-react?a=10&b=abc&c=false')
      .expect('Content-Type', /html/)
      .expect(200, '<!doctype html>\n<div data-a="10" data-b="abc" data-c="false">react view</div>')
  })

  it('support use Link to auto prefix basename', async () => {
    const http = createHttp()
    const server = http.server()
    const router = Router()

    http.route('/base0').use(router)

    router
      .match({
        pathname: '/test-react',
      })
      .use((request) => {
        const ReactView = useReactView()

        return ReactView.render(<Link href={request.pathname}>{request.pathname}</Link>)
      })

    await request(server)
      .get('/base0/test-react')
      .expect(200, '<!doctype html>\n<a href="/base0/test-react">/test-react</a>')
  })
})
