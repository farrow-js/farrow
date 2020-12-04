import { createRouterPipeline as Router } from '../router'
import { Response } from '../response'
import { Nullable, Schema, Struct, Strict } from 'farrow-schema'

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
})
