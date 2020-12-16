import { createRouterPipeline as Router } from '../router'
import { Response } from '../response'
import { Nullable, Schema, Struct, Strict, Union, Literal } from 'farrow-schema'
import { Stream } from 'stream'

describe('Router', () => {
  it('should validating pathname & method', async () => {
    let router = Router()
    let schema = {
      pathname: '/test',
    }

    router.match(schema).use(async (request) => {
      return Response.json(request)
    })

    expect(() => {
      router.run({
        pathname: '/abc',
      })
    }).toThrow()

    let result = await router.run({
      pathname: '/test',
    })

    expect(result.info.body).toEqual({
      type: 'json',
      value: {
        pathname: '/test',
      },
    })
  })

  it('should validating method & params & query & body & headers & cookies', async () => {
    let router = Router()

    let schema = {
      pathname: '/detail/:id',
      method: 'POST',
      params: {
        id: Number,
      },
      query: {
        a: Number,
        b: String,
        c: Boolean,
      },
      body: Nullable({
        a: Number,
        b: String,
        c: Boolean,
        d: {
          a: Number,
          b: String,
          c: Boolean,
        },
      }),
      headers: {
        a: Number,
        b: String,
        c: Boolean,
      },
      cookies: {
        a: Number,
        b: String,
        c: Boolean,
      },
    }

    router.match(schema).use(async (request) => {
      return Response.json(request)
    })

    expect(() => {
      router.run({
        pathname: '/detail/abc',
      })
    }).toThrow()

    let request0 = {
      pathname: '/detail/123',
      method: 'POST',
      params: {
        id: 123,
      },
      query: {
        a: '1',
        b: '1',
        c: 'false',
      },
      body: null,
      headers: {
        a: '1',
        b: '1',
        c: 'false',
      },
      cookies: {
        a: '1',
        b: '1',
        c: 'false',
      },
    }

    let result0 = await router.run(request0)

    expect(result0.info.body).toEqual({
      type: 'json',
      value: {
        pathname: '/detail/123',
        method: 'POST',
        params: {
          id: 123,
        },
        query: {
          a: 1,
          b: '1',
          c: false,
        },
        body: null,
        headers: {
          a: 1,
          b: '1',
          c: false,
        },
        cookies: {
          a: 1,
          b: '1',
          c: false,
        },
      },
    })

    let request1 = {
      ...request0,
      body: {
        a: 1,
        b: '1',
        c: false,
        d: {
          a: 1,
          b: '1',
          c: false,
        },
      },
    }

    let result1 = await router.run(request1)

    expect(result1.info.body).toEqual({
      type: 'json',
      value: {
        pathname: '/detail/123',
        method: 'POST',
        params: {
          id: 123,
        },
        query: {
          a: 1,
          b: '1',
          c: false,
        },
        body: {
          a: 1,
          b: '1',
          c: false,
          d: {
            a: 1,
            b: '1',
            c: false,
          },
        },
        headers: {
          a: 1,
          b: '1',
          c: false,
        },
        cookies: {
          a: 1,
          b: '1',
          c: false,
        },
      },
    })

    let request2 = {
      ...request1,
      query: {},
    }

    expect(() => {
      router.run(request2)
    }).toThrow()
  })

  it('can validate number | int | float | boolean strictly', async () => {
    let router0 = Router()

    let router1 = Router()

    router0
      .match({
        pathname: '/',
        query: {
          id: Strict(Number),
        },
      })
      .use((request) => {
        return Response.json(request)
      })

    router1
      .match({
        pathname: '/',
        query: {
          id: Number,
        },
      })
      .use((request) => {
        return Response.json(request)
      })

    expect(() => {
      router0.run({
        pathname: '/',
        query: {
          id: '123',
        },
      })
    }).toThrow()

    let result1 = await router1.run({
      pathname: '/',
      query: {
        id: '123',
      },
    })

    expect(result1.info.body).toEqual({
      type: 'json',
      value: {
        pathname: '/',
        query: {
          id: 123,
        },
      },
    })
  })

  it('support passing regexp to schema.pathname', async () => {
    let router = Router()

    router
      .match({
        pathname: /^\/test/i,
      })
      .use((request) => {
        return Response.json(request)
      })

    expect(() => {
      router.run({
        pathname: '/abc',
      })
    }).toThrow()

    expect(() => {
      router.run({
        pathname: '/abc/test',
      })
    }).toThrow()

    let result0 = await router.run({
      pathname: '/test/abc',
    })

    let result1 = await router.run({
      pathname: '/test/efg',
    })

    expect(result0.info.body).toEqual({
      type: 'json',
      value: {
        pathname: '/test/abc',
      },
    })

    expect(result1.info.body).toEqual({
      type: 'json',
      value: {
        pathname: '/test/efg',
      },
    })
  })

  it('support detect response body and content-type', async () => {
    let router = Router()

    let contentTypes = [] as string[]

    let bodyTypes = [] as string[]

    router.use(async (request, next) => {
      let response = await next(request)

      if (response.is('json')) {
        contentTypes.push('json')
      }

      if (response.is('text')) {
        contentTypes.push('text')
      }

      if (response.is('html')) {
        contentTypes.push('html')
      }

      if (response.info.body?.type) {
        bodyTypes.push(response.info.body?.type)
      }

      return response
    })

    router
      .match({
        pathname: '/:type',
        params: {
          type: Union(
            Literal('json'),
            Literal('text'),
            Literal('html'),
            Literal('string'),
            Literal('buffer'),
            Literal('stream'),
          ),
        },
      })
      .use((request) => {
        if (request.params.type === 'string') {
          return Response.string('test')
        }

        if (request.params.type === 'text') {
          return Response.text('test')
        }

        if (request.params.type === 'buffer') {
          return Response.buffer(Buffer.from('test'))
        }

        if (request.params.type === 'html') {
          return Response.html('test')
        }

        if (request.params.type === 'json') {
          return Response.json('test')
        }

        if (request.params.type === 'stream') {
          return Response.stream(
            new Stream.Readable({
              read() {
                this.push('test')
                this.push(null)
              },
            }),
          )
        }

        return Response.json(request)
      })

    await router.run({
      pathname: '/json',
    })

    await router.run({
      pathname: '/json',
    })

    await router.run({
      pathname: '/text',
    })

    await router.run({
      pathname: '/buffer',
    })

    await router.run({
      pathname: '/html',
    })

    await router.run({
      pathname: '/stream',
    })

    await router.run({
      pathname: '/string',
    })

    expect(contentTypes).toEqual(['json', 'json', 'text', 'html'])
    expect(bodyTypes).toEqual(['json', 'json', 'string', 'buffer', 'string', 'stream', 'string'])
  })
})
