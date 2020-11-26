import { createRouterPipeline as Router } from '../router'
import { Response } from '../response'
import { Nullable, Struct } from 'farrow-schema'

describe('Router', () => {
  it('should validating pathname & method', async () => {
    let router = Router({
      pathname: '/test',
    })

    router.use(async (request) => {
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
    let router = Router({
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
    })

    router.use(async (request) => {
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
    }

    let result0 = await router.run(request0)

    expect(result0.info.body).toEqual({
      type: 'json',
      value: request0,
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
      value: request1,
    })

    let request2 = {
      ...request1,
      query: null,
    }

    expect(() => {
      router.run(request2)
    }).toThrow()
  })

  it('should validate number | int | float | boolean strictly', async () => {
    let router0 = Router(
      {
        pathname: '/',
        query: {
          id: Number,
        },
      },
      {
        strict: true,
      },
    )

    let router1 = Router({
      pathname: '/',
      query: {
        id: Number,
      },
    })

    router0.use((request) => {
      return Response.json(request)
    })

    router1.use((request) => {
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
})
