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
  })
})
