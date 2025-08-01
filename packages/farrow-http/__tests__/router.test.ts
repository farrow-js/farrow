import { Router } from '../src/router'
import { Response } from '../src/response'
import { Nullable, Strict, Union, Literal, JsonType, Int, Float } from 'farrow-schema'
import { Stream } from 'stream'
import * as asyncHooksNode from 'farrow-pipeline/asyncTracerImpl.node'

// enable async hooks
asyncHooksNode.enable()

describe('Router', () => {
  it('should validating pathname & method', async () => {
    const router = Router()
    const schema = {
      pathname: '/test',
    }

    router.match(schema).use((request) => {
      return Response.json(request)
    })

    expect(() =>
      router.run({
        pathname: '/abc',
      }),
    ).toThrow()

    const result = await router.run({
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
    const router = Router()

    const schema = {
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

    router.match(schema).use((request) => {
      return Response.json(request)
    })

    expect(() =>
      router.run({
        pathname: '/detail/abc',
      }),
    ).toThrow()

    const request0 = {
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

    const result0 = await router.run(request0)

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

    const request1 = {
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

    const result1 = await router.run(request1)

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

    const request2 = {
      ...request1,
      query: {},
    }

    expect(() => router.run(request2)).toThrow()
  })

  it('can validate number | int | float | boolean strictly', async () => {
    const router0 = Router()

    const router1 = Router()

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

    expect(() =>
      router0.run({
        pathname: '/',
        query: {
          id: '123',
        },
      }),
    ).toThrow()

    const result1 = await router1.run({
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
    const router = Router()

    router
      .match({
        pathname: /^\/test/i,
      })
      .use((request) => {
        return Response.json(request)
      })

    expect(() =>
      router.run({
        pathname: '/abc',
      }),
    ).toThrow()

    expect(() =>
      router.run({
        pathname: '/abc/test',
      }),
    ).toThrow()

    const result0 = await router.run({
      pathname: '/test/abc',
    })

    const result1 = await router.run({
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
    const router = Router()

    const contentTypes = [] as string[]

    const bodyTypes = [] as string[]

    router.use(async (request, next) => {
      const response = await next(request)

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

describe('Router Url Pattern', () => {
  it('support dynamic params in pathname', async () => {
    const router = Router()

    router
      .match({
        url: '/string/<arg:string>',
      })
      .use((request) => {
        return Response.json({
          type: 'string',
          arg: request.params.arg,
        })
      })

    router
      .match({
        url: '/boolean/<arg:boolean>',
      })
      .use((request) => {
        return Response.json({
          type: 'boolean',
          arg: request.params.arg,
        })
      })

    router
      .match({
        url: '/number/<arg:number>',
      })
      .use((request) => {
        return Response.json({
          type: 'number',
          arg: request.params.arg,
        })
      })

    router
      .match({
        url: '/int/<arg:int>',
      })
      .use((request) => {
        return Response.json({
          type: 'int',
          arg: request.params.arg,
        })
      })

    router
      .match({
        url: '/float/<arg:float>',
      })
      .use((request) => {
        return Response.json({
          type: 'float',
          arg: request.params.arg,
        })
      })

    router
      .match({
        url: '/id/<arg:id>',
      })
      .use((request) => {
        return Response.json({
          type: 'id',
          arg: request.params.arg,
        })
      })

    router
      .match({
        url: '/literal/<arg:{123}|{abc}>',
      })
      .use((request) => {
        return Response.json({
          type: 'literal',
          arg: request.params.arg,
        })
      })

    router
      .match({
        url: '/union/<arg:number|boolean|string>',
      })
      .use((request) => {
        return Response.json({
          type: 'union',
          arg: request.params.arg,
        })
      })

    expect(() =>
      router.run({
        pathname: '/abc',
      }),
    ).toThrow()

    const result0 = await router.run({
      pathname: '/string/123',
    })

    expect(result0.info.body).toEqual({
      type: 'json',
      value: {
        type: 'string',
        arg: '123',
      },
    })

    const result1 = await router.run({
      pathname: '/number/123.456',
    })

    expect(result1.info.body).toEqual({
      type: 'json',
      value: {
        type: 'number',
        arg: 123.456,
      },
    })

    const result2 = await router.run({
      pathname: '/int/123.456',
    })

    expect(result2.info.body).toEqual({
      type: 'json',
      value: {
        type: 'int',
        arg: 123,
      },
    })

    const result3 = await router.run({
      pathname: '/float/123.456',
    })

    expect(result3.info.body).toEqual({
      type: 'json',
      value: {
        type: 'float',
        arg: 123.456,
      },
    })

    const result4 = await router.run({
      pathname: '/boolean/true',
    })

    expect(result4.info.body).toEqual({
      type: 'json',
      value: {
        type: 'boolean',
        arg: true,
      },
    })

    const result5 = await router.run({
      pathname: '/boolean/false',
    })

    expect(result5.info.body).toEqual({
      type: 'json',
      value: {
        type: 'boolean',
        arg: false,
      },
    })

    const result6 = await router.run({
      pathname: '/id/1234123',
    })

    expect(result6.info.body).toEqual({
      type: 'json',
      value: {
        type: 'id',
        arg: '1234123',
      },
    })

    const result7 = await router.run({
      pathname: '/literal/123',
    })

    expect(result7.info.body).toEqual({
      type: 'json',
      value: {
        type: 'literal',
        arg: '123',
      },
    })

    const result8 = await router.run({
      pathname: '/literal/abc',
    })

    expect(result8.info.body).toEqual({
      type: 'json',
      value: {
        type: 'literal',
        arg: 'abc',
      },
    })

    const result9 = await router.run({
      pathname: '/union/abc',
    })

    expect(result9.info.body).toEqual({
      type: 'json',
      value: {
        type: 'union',
        arg: 'abc',
      },
    })

    const result10 = await router.run({
      pathname: '/union/123',
    })

    expect(result10.info.body).toEqual({
      type: 'json',
      value: {
        type: 'union',
        arg: 123,
      },
    })

    const result11 = await router.run({
      pathname: '/union/false',
    })

    expect(result11.info.body).toEqual({
      type: 'json',
      value: {
        type: 'union',
        arg: false,
      },
    })
  })

  it('support dynamic params in querystring', async () => {
    const router = Router()

    router
      .match({
        url: '/string?<arg:string>',
      })
      .use((request) => {
        return Response.json({
          type: 'string',
          arg: request.query.arg,
        })
      })

    router
      .match({
        url: '/boolean?<arg:boolean>',
      })
      .use((request) => {
        return Response.json({
          type: 'boolean',
          arg: request.query.arg,
        })
      })

    router
      .match({
        url: '/number?<arg:number>',
      })
      .use((request) => {
        return Response.json({
          type: 'number',
          arg: request.query.arg,
        })
      })

    router
      .match({
        url: '/int?<arg:int>',
      })
      .use((request) => {
        return Response.json({
          type: 'int',
          arg: request.query.arg,
        })
      })

    router
      .match({
        url: '/float?<arg:float>',
      })
      .use((request) => {
        return Response.json({
          type: 'float',
          arg: request.query.arg,
        })
      })

    router
      .match({
        url: '/id?<arg:id>',
      })
      .use((request) => {
        return Response.json({
          type: 'id',
          arg: request.query.arg,
        })
      })

    router
      .match({
        url: '/literal?<arg:{123}|{abc}>',
      })
      .use((request) => {
        return Response.json({
          type: 'literal',
          arg: request.query.arg,
        })
      })

    router
      .match({
        url: '/union?<arg:number|boolean|string>',
      })
      .use((request) => {
        return Response.json({
          type: 'union',
          arg: request.query.arg,
        })
      })

    expect(() =>
      router.run({
        pathname: '/abc',
      }),
    ).toThrow()

    const result0 = await router.run({
      pathname: '/string',
      query: {
        arg: '123',
      },
    })

    expect(result0.info.body).toEqual({
      type: 'json',
      value: {
        type: 'string',
        arg: '123',
      },
    })

    const result1 = await router.run({
      pathname: '/number',
      query: {
        arg: '123.456',
      },
    })

    expect(result1.info.body).toEqual({
      type: 'json',
      value: {
        type: 'number',
        arg: 123.456,
      },
    })

    const result2 = await router.run({
      pathname: '/int',
      query: {
        arg: '123.456',
      },
    })

    expect(result2.info.body).toEqual({
      type: 'json',
      value: {
        type: 'int',
        arg: 123,
      },
    })

    const result3 = await router.run({
      pathname: '/float',
      query: {
        arg: '123.456',
      },
    })

    expect(result3.info.body).toEqual({
      type: 'json',
      value: {
        type: 'float',
        arg: 123.456,
      },
    })

    const result4 = await router.run({
      pathname: '/boolean',
      query: {
        arg: 'true',
      },
    })

    expect(result4.info.body).toEqual({
      type: 'json',
      value: {
        type: 'boolean',
        arg: true,
      },
    })

    const result5 = await router.run({
      pathname: '/boolean',
      query: {
        arg: 'false',
      },
    })

    expect(result5.info.body).toEqual({
      type: 'json',
      value: {
        type: 'boolean',
        arg: false,
      },
    })

    const result6 = await router.run({
      pathname: '/id',
      query: {
        arg: '1234123',
      },
    })

    expect(result6.info.body).toEqual({
      type: 'json',
      value: {
        type: 'id',
        arg: '1234123',
      },
    })

    const result7 = await router.run({
      pathname: '/literal',
      query: {
        arg: '123',
      },
    })

    expect(result7.info.body).toEqual({
      type: 'json',
      value: {
        type: 'literal',
        arg: '123',
      },
    })

    const result8 = await router.run({
      pathname: '/literal',
      query: {
        arg: 'abc',
      },
    })

    expect(result8.info.body).toEqual({
      type: 'json',
      value: {
        type: 'literal',
        arg: 'abc',
      },
    })

    const result9 = await router.run({
      pathname: '/union',
      query: {
        arg: 'abc',
      },
    })

    expect(result9.info.body).toEqual({
      type: 'json',
      value: {
        type: 'union',
        arg: 'abc',
      },
    })

    const result10 = await router.run({
      pathname: '/union',
      query: {
        arg: '123',
      },
    })

    expect(result10.info.body).toEqual({
      type: 'json',
      value: {
        type: 'union',
        arg: 123,
      },
    })

    const result11 = await router.run({
      pathname: '/union',
      query: {
        arg: 'false',
      },
    })

    expect(result11.info.body).toEqual({
      type: 'json',
      value: {
        type: 'union',
        arg: false,
      },
    })
  })

  it('support static params in querystring', async () => {
    const router = Router()

    router
      .match({
        url: '/static?a=1&b=2',
      })
      .use((request) => {
        return Response.json({
          type: 'static',
          query: request.query,
        })
      })

    router
      .match({
        url: '/mix0?a=1&b=2&<c:int>',
      })
      .use((request) => {
        return Response.json({
          type: 'mix0',
          query: request.query,
        })
      })

    router
      .match({
        url: '/mix1?<a:int>&b=2&<c:int>',
      })
      .use((request) => {
        return Response.json({
          type: 'mix1',
          query: request.query,
        })
      })

    router
      .match({
        url: '/mix2?a=1&<b:id>&c=abc',
      })
      .use((request) => {
        return Response.json({
          type: 'mix2',
          query: request.query,
        })
      })

    expect(() =>
      router.run({
        pathname: '/static',
        query: {
          a: 'a',
          b: 'b',
        },
      }),
    ).toThrow()

    const result0 = await router.run({
      pathname: '/static',
      query: {
        a: '1',
        b: '2',
      },
    })

    expect(result0.info.body).toEqual({
      type: 'json',
      value: {
        type: 'static',
        query: {
          a: '1',
          b: '2',
        },
      },
    })

    const result1 = await router.run({
      pathname: '/mix0',
      query: {
        a: '1',
        b: '2',
        c: '3.14159',
      },
    })

    expect(result1.info.body).toEqual({
      type: 'json',
      value: {
        type: 'mix0',
        query: {
          a: '1',
          b: '2',
          c: 3,
        },
      },
    })

    const result2 = await router.run({
      pathname: '/mix0',
      query: {
        a: '1',
        b: '2',
        c: 30000,
      },
    })

    expect(result2.info.body).toEqual({
      type: 'json',
      value: {
        type: 'mix0',
        query: {
          a: '1',
          b: '2',
          c: 30000,
        },
      },
    })

    expect(() =>
      router.run({
        pathname: '/mix0',
        query: {
          a: '1',
          b: '2',
          c: 'abc',
        },
      }),
    ).toThrow()

    const result3 = await router.run({
      pathname: '/mix1',
      query: {
        a: '1',
        b: '2',
        c: 30000,
      },
    })

    expect(result3.info.body).toEqual({
      type: 'json',
      value: {
        type: 'mix1',
        query: {
          a: 1,
          b: '2',
          c: 30000,
        },
      },
    })

    expect(() =>
      router.run({
        pathname: '/mix1',
        query: {
          a: '1',
          b: '3',
          c: 30000,
        },
      }),
    ).toThrow()

    const result4 = await router.run({
      pathname: '/mix2',
      query: {
        a: '1',
        b: '2123123123',
        c: 'abc',
      },
    })

    expect(result4.info.body).toEqual({
      type: 'json',
      value: {
        type: 'mix2',
        query: {
          a: '1',
          b: '2123123123',
          c: 'abc',
        },
      },
    })

    expect(() =>
      router.run({
        pathname: '/mix1',
        query: {
          a: '2',
          b: '3',
          c: 'abc',
        },
      }),
    ).toThrow()
  })

  it('support using dynamic params in pathname and querystring at the same time', async () => {
    const router = Router()

    router
      .match({
        url: '/test0/<name:string>/<age:int>?static=abc&<dynamic:int>',
      })
      .use((request) => {
        return Response.json({
          type: 'test0',
          ...request,
        })
      })

    expect(() =>
      router.run({
        pathname: '/test0/farrow/20',
        query: {
          static: 'abc',
        },
      }),
    ).toThrow()

    const result0 = await router.run({
      pathname: '/test0/farrow/20',
      query: {
        static: 'abc',
        dynamic: '20',
      },
    })

    expect(result0.info.body).toEqual({
      type: 'json',
      value: {
        type: 'test0',
        pathname: '/test0/farrow/20',
        params: {
          name: 'farrow',
          age: 20,
        },
        query: {
          static: 'abc',
          dynamic: 20,
        },
      },
    })
  })

  it('support modifier in dynamic params', async () => {
    const router = Router()

    router
      .match({
        url: '/optional/<name?:string>',
      })
      .use((request) => {
        return Response.json({
          type: 'optional',
          value: request.params.name ?? 'default-value',
        })
      })

    router
      .match({
        url: '/zero/or/more/<name*:string>',
      })
      .use((request) => {
        return Response.json({
          type: 'zero-or-more',
          value: request.params.name as JsonType,
        })
      })

    router
      .match({
        url: '/one/or/more/<name+:string>',
      })
      .use((request) => {
        return Response.json({
          type: 'one-or-more',
          value: request.params.name as JsonType,
        })
      })

    const result0 = await router.run({
      pathname: '/optional',
    })

    expect(result0.info.body).toEqual({
      type: 'json',
      value: {
        type: 'optional',
        value: 'default-value',
      },
    })

    const result1 = await router.run({
      pathname: '/optional/abc',
    })

    expect(result1.info.body).toEqual({
      type: 'json',
      value: {
        type: 'optional',
        value: 'abc',
      },
    })

    const result2 = await router.run({
      pathname: '/zero/or/more',
    })

    expect(result2.info.body).toEqual({
      type: 'json',
      value: {
        type: 'zero-or-more',
      },
    })

    const result3 = await router.run({
      pathname: '/zero/or/more/abc',
    })

    expect(result3.info.body).toEqual({
      type: 'json',
      value: {
        type: 'zero-or-more',
        value: ['abc'],
      },
    })

    const result4 = await router.run({
      pathname: '/zero/or/more/abc/efg',
    })

    expect(result4.info.body).toEqual({
      type: 'json',
      value: {
        type: 'zero-or-more',
        value: ['abc', 'efg'],
      },
    })

    expect(() =>
      router.run({
        pathname: '/one/or/more',
      }),
    ).toThrow()

    const result6 = await router.run({
      pathname: '/one/or/more/abc',
    })

    expect(result6.info.body).toEqual({
      type: 'json',
      value: {
        type: 'one-or-more',
        value: ['abc'],
      },
    })

    const result7 = await router.run({
      pathname: '/one/or/more/abc/efg',
    })

    expect(result7.info.body).toEqual({
      type: 'json',
      value: {
        type: 'one-or-more',
        value: ['abc', 'efg'],
      },
    })
  })

  it('support routing methods', async () => {
    const router = Router()

    router.get('/get0/<arg0:int>?<arg1:int>').use(
      (request: {
        readonly pathname: string
        readonly params: {
          readonly arg0: number
        }
        readonly query: {
          readonly arg1: number
        }
        readonly method: string
      }) => {
        return Response.json({
          type: 'get',
          request,
        })
      },
    )

    router
      .get('/get1/<arg0:int>?<arg1:int>', {
        headers: {
          a: Int,
        },
      })
      .use(
        (request: {
          readonly pathname: string
          readonly params: {
            readonly arg0: number
          }
          readonly query: {
            readonly arg1: number
          }
          readonly method: string
          readonly headers: {
            readonly a: number
          }
        }) => {
          return Response.json({
            type: 'get',
            request,
          })
        },
      )

    router
      .post('/post/<arg0:int>?<arg1:int>', {
        body: {
          a: Int,
          b: Float,
        },
      })
      .use((request) => {
        return Response.json({
          type: 'post',
          request,
        })
      })

    router
      .put('/put/<arg0:int>?<arg1:int>', {
        body: {
          a: Int,
          b: Float,
        },
      })
      .use((request) => {
        return Response.json({
          type: 'put',
          request,
        })
      })

    router
      .delete('/delete/<arg0:int>?<arg1:int>', {
        body: {
          a: Int,
          b: Float,
        },
      })
      .use((request) => {
        return Response.json({
          type: 'delete',
          request,
        })
      })

    router
      .patch('/patch/<arg0:int>?<arg1:int>', {
        body: {
          a: Int,
          b: Float,
        },
      })
      .use((request) => {
        return Response.json({
          type: 'patch',
          request,
        })
      })

    router
      .head('/head/<arg0:int>?<arg1:int>', {
        body: {
          a: Int,
          b: Float,
        },
      })
      .use((request) => {
        return Response.json({
          type: 'head',
          request,
        })
      })

    router
      .options('/options/<arg0:int>?<arg1:int>', {
        body: {
          a: Int,
          b: Float,
        },
      })
      .use((request) => {
        return Response.json({
          type: 'options',
          request,
        })
      })

    const result0 = await router.run({
      pathname: '/get0/123',
      method: 'get',
      query: {
        arg1: '456',
      },
    })

    expect(result0.info.body).toEqual({
      type: 'json',
      value: {
        type: 'get',
        request: {
          method: 'get',
          pathname: '/get0/123',
          params: {
            arg0: 123,
          },
          query: {
            arg1: 456,
          },
        },
      },
    })

    const result1 = await router.run({
      pathname: '/get1/123',
      method: 'get',
      query: {
        arg1: '456',
      },
      headers: {
        a: '789',
      },
    })

    expect(result1.info.body).toEqual({
      type: 'json',
      value: {
        type: 'get',
        request: {
          pathname: '/get1/123',
          method: 'get',
          params: {
            arg0: 123,
          },
          query: {
            arg1: 456,
          },
          headers: {
            a: 789,
          },
        },
      },
    })

    const result2 = await router.run({
      pathname: '/post/123',
      method: 'post',
      query: {
        arg1: '456',
      },
      body: {
        a: 3,
        b: 3.14,
      },
    })

    expect(result2.info.body).toEqual({
      type: 'json',
      value: {
        type: 'post',
        request: {
          pathname: '/post/123',
          method: 'post',
          params: {
            arg0: 123,
          },
          query: {
            arg1: 456,
          },
          body: {
            a: 3,
            b: 3.14,
          },
        },
      },
    })

    const result3 = await router.run({
      pathname: '/put/123',
      method: 'put',
      query: {
        arg1: '456',
      },
      body: {
        a: 3,
        b: 3.14,
      },
    })

    expect(result3.info.body).toEqual({
      type: 'json',
      value: {
        type: 'put',
        request: {
          pathname: '/put/123',
          method: 'put',
          params: {
            arg0: 123,
          },
          query: {
            arg1: 456,
          },
          body: {
            a: 3,
            b: 3.14,
          },
        },
      },
    })

    const result4 = await router.run({
      pathname: '/patch/123',
      method: 'patch',
      query: {
        arg1: '456',
      },
      body: {
        a: 3,
        b: 3.14,
      },
    })

    expect(result4.info.body).toEqual({
      type: 'json',
      value: {
        type: 'patch',
        request: {
          pathname: '/patch/123',
          method: 'patch',
          params: {
            arg0: 123,
          },
          query: {
            arg1: 456,
          },
          body: {
            a: 3,
            b: 3.14,
          },
        },
      },
    })

    const result5 = await router.run({
      pathname: '/head/123',
      method: 'head',
      query: {
        arg1: '456',
      },
      body: {
        a: 3,
        b: 3.14,
      },
    })

    expect(result5.info.body).toEqual({
      type: 'json',
      value: {
        type: 'head',
        request: {
          pathname: '/head/123',
          method: 'head',
          params: {
            arg0: 123,
          },
          query: {
            arg1: 456,
          },
          body: {
            a: 3,
            b: 3.14,
          },
        },
      },
    })

    const result6 = await router.run({
      pathname: '/options/123',
      method: 'options',
      query: {
        arg1: '456',
      },
      body: {
        a: 3,
        b: 3.14,
      },
    })

    expect(result6.info.body).toEqual({
      type: 'json',
      value: {
        type: 'options',
        request: {
          pathname: '/options/123',
          method: 'options',
          params: {
            arg0: 123,
          },
          query: {
            arg1: 456,
          },
          body: {
            a: 3,
            b: 3.14,
          },
        },
      },
    })

    const result7 = await router.run({
      pathname: '/delete/123',
      method: 'delete',
      query: {
        arg1: '456',
      },
      body: {
        a: 3,
        b: 3.14,
      },
    })

    expect(result7.info.body).toEqual({
      type: 'json',
      value: {
        type: 'delete',
        request: {
          pathname: '/delete/123',
          method: 'delete',
          params: {
            arg0: 123,
          },
          query: {
            arg1: 456,
          },
          body: {
            a: 3,
            b: 3.14,
          },
        },
      },
    })
  })

  it('support literal string unions', async () => {
    const router = Router()

    router.get('/some-service/<client:{mac}|{win}|{iphone}|{android}|{api}>/users/<id:number>').use(
      (request: {
        readonly pathname: string
        readonly params: {
          readonly client: 'mac' | 'win' | 'iphone' | 'android' | 'api'
          readonly id: number
        }
        readonly method: string
      }) => {
        return Response.json(request)
      },
    )

    const result0 = await router.run({
      pathname: '/some-service/mac/users/123',
      method: 'GET',
    })

    expect(result0.info.body).toEqual({
      type: 'json',
      value: {
        pathname: '/some-service/mac/users/123',
        method: 'GET',
        params: {
          client: 'mac',
          id: 123,
        },
      },
    })
  })

  it('should route work well', async () => {
    const router = Router()

    router.route('/foo').use(() => {
      return Response.text('foo')
    })
    router.route('/foobar').use(() => {
      return Response.text('foobar')
    })

    const result0 = await router.run({ pathname: '/foo' })
    expect(result0.info.body).toMatchObject({ type: 'string', value: 'foo' })

    const result1 = await router.run({ pathname: '/foobar' })
    expect(result1.info.body).toMatchObject({ type: 'string', value: 'foobar' })
  })

  it('should work well with route with single slash basename', async () => {
    const router = Router()

    router.route('/foo').use(() => {
      return Response.text('foo')
    })

    router.route('/').use(() => {
      return Response.text('slash')
    })

    const result0 = await router.run(
      { pathname: '/foo' },
      {
        onLast: () => {
          return Response.text('error')
        },
      },
    )
    expect(result0.info.body).toMatchObject({ type: 'string', value: 'foo' })

    const result1 = await router.run(
      { pathname: '/foobar' },
      {
        onLast: () => {
          return Response.text('error')
        },
      },
    )
    expect(result1.info.body).toMatchObject({ type: 'string', value: 'slash' })

    const result2 = await router.run(
      { pathname: '/' },
      {
        onLast: () => {
          return Response.text('error')
        },
      },
    )
    expect(result2.info.body).toMatchObject({ type: 'string', value: 'slash' })

    const result3 = await router.run(
      { pathname: '/test' },
      {
        onLast: () => {
          return Response.text('error')
        },
      },
    )
    expect(result3.info.body).toMatchObject({ type: 'string', value: 'slash' })
  })

  it('should throw error with route with empty basename', () => {
    const router = Router()

    router.route('/foo').use(() => {
      return Response.text('foo')
    })

    expect(() => router.route('')).toThrowError(
      `expect the basename passed to 'http.route' should be absolute, accept \`\``,
    )
  })
})

describe('Router onSchemaError', () => {
  it('should handle schema validation error with custom response', async () => {
    const router = Router()

    router
      .match(
        {
          pathname: '/test',
          query: {
            id: Number,
          },
        },
        {
          onSchemaError: (error, input, next) => {
            return Response.status(422).json({
              error: 'Custom validation error',
              details: error.message,
              path: error.path,
              requestPath: input.pathname,
            })
          },
        },
      )
      .use((request) => {
        return Response.json(request)
      })

    const result = await router.run({
      pathname: '/test',
      query: {
        id: 'invalid-number',
      },
    })

    expect(result.info.body).toEqual({
      type: 'json',
      value: {
        error: 'Custom validation error',
        details: expect.any(String),
        path: expect.any(Array),
        requestPath: '/test',
      },
    })
    expect(result.info.status).toEqual({
      code: 422,
      message: '',
    })
  })

  it('should handle schema validation error and continue with next()', async () => {
    const router = Router()
    let fallbackCalled = false

    router
      .match(
        {
          pathname: '/test',
          query: {
            id: Number,
          },
        },
        {
          onSchemaError: (error, input, next) => {
            // Don't return response, continue processing
            return next(input)
          },
        },
      )
      .use((request) => {
        return Response.json(request)
      })

    // Add fallback handler
    router.use((request, next) => {
      fallbackCalled = true
      return Response.status(400).json({
        error: 'Fallback error handler',
        pathname: request.pathname,
      })
    })

    const result = await router.run({
      pathname: '/test',
      query: {
        id: 'invalid-number',
      },
    })

    expect(fallbackCalled).toBe(true)
    expect(result.info.body).toEqual({
      type: 'json',
      value: {
        error: 'Fallback error handler',
        pathname: '/test',
      },
    })
    expect(result.info.status).toEqual({
      code: 400,
      message: '',
    })
  })

  it('should handle schema validation error with async response', async () => {
    const router = Router()

    router
      .match(
        {
          pathname: '/test',
          method: 'POST',
          body: {
            name: String,
            age: Number,
          },
        },
        {
          onSchemaError: async (error, input, next) => {
            // Simulate async processing
            await new Promise((resolve) => setTimeout(resolve, 10))

            return Response.status(400).json({
              error: 'Async validation error',
              details: error.message,
              timestamp: Date.now(),
            })
          },
        },
      )
      .use((request) => {
        return Response.json(request)
      })

    const result = await router.run({
      pathname: '/test',
      method: 'POST',
      body: {
        name: 'test',
        age: 'invalid-age',
      },
    })

    expect(result.info.body).toEqual({
      type: 'json',
      value: {
        error: 'Async validation error',
        details: expect.any(String),
        timestamp: expect.any(Number),
      },
    })
    expect(result.info.status).toEqual({
      code: 400,
      message: '',
    })
  })

  it('should handle schema validation error with conditional logic', async () => {
    const router = Router()

    router
      .match(
        {
          pathname: '/test',
          query: {
            id: Number,
            type: String,
          },
        },
        {
          onSchemaError: (error, input, next) => {
            // Return different responses based on error type
            if (error.path?.includes('id')) {
              return Response.status(400).json({
                error: 'Invalid ID format',
                suggestion: 'Please provide a valid number',
              })
            }

            if (error.path?.includes('type')) {
              return Response.status(400).json({
                error: 'Invalid type parameter',
                allowedTypes: ['user', 'admin', 'guest'],
              })
            }

            // Continue with default handling for other errors
            return next(input)
          },
        },
      )
      .use((request) => {
        return Response.json(request)
      })

    // Test ID error
    const result1 = await router.run({
      pathname: '/test',
      query: {
        id: 'invalid-id',
        type: 'user',
      },
    })

    expect(result1.info.body).toEqual({
      type: 'json',
      value: {
        error: 'Invalid ID format',
        suggestion: 'Please provide a valid number',
      },
    })

    // Test type error
    const result2 = await router.run({
      pathname: '/test',
      query: {
        id: '123',
        type: 123,
      },
    })

    expect(result2.info.body).toEqual({
      type: 'json',
      value: {
        error: 'Invalid type parameter',
        allowedTypes: ['user', 'admin', 'guest'],
      },
    })
  })

  it('should handle schema validation error with request context', async () => {
    const router = Router()

    router
      .match(
        {
          pathname: '/api/:version/users/:id',
          params: {
            version: String,
            id: Number,
          },
          headers: {
            'x-api-key': String,
          },
        },
        {
          onSchemaError: (error, input, next) => {
            // Provide more detailed error information based on request context
            const context = {
              pathname: input.pathname,
              method: input.method,
              headers: input.headers,
              userAgent: input.headers?.['user-agent'],
            }

            return Response.status(422).json({
              error: 'Validation failed',
              context,
              validationError: {
                message: error.message,
                path: error.path,
              },
            })
          },
        },
      )
      .use((request) => {
        return Response.json(request)
      })

    const result = await router.run({
      pathname: '/api/v1/users/invalid-id',
      method: 'GET',
      headers: {
        'x-api-key': 'test-key',
        'user-agent': 'test-agent',
      },
    })

    expect(result.info.body).toEqual({
      type: 'json',
      value: {
        error: 'Validation failed',
        context: {
          pathname: '/api/v1/users/invalid-id',
          method: 'GET',
          headers: {
            'x-api-key': 'test-key',
            'user-agent': 'test-agent',
          },
          userAgent: 'test-agent',
        },
        validationError: {
          message: expect.any(String),
          path: expect.any(Array),
        },
      },
    })
    expect(result.info.status).toEqual({
      code: 422,
      message: '',
    })
  })

  it('should handle schema validation error with URL pattern', async () => {
    const router = Router()

    router
      .match(
        {
          url: '/api/<version:string>/users/<id:int>?<page:int>',
        },
        {
          onSchemaError: (error, input, next) => {
            // Parse URL parameter errors
            const urlInfo = {
              pathname: input.pathname,
              query: input.query,
              errorType: error.path?.join('.'),
            }

            return Response.status(400).json({
              error: 'URL parameter validation failed',
              urlInfo,
              suggestion: 'Check your URL parameters',
            })
          },
        },
      )
      .use((request) => {
        return Response.json(request)
      })

    // Test path parameter error
    const result1 = await router.run({
      pathname: '/api/v1/users/invalid-id',
      query: {
        page: '1',
      },
    })

    expect(result1.info.body).toEqual({
      type: 'json',
      value: {
        error: 'URL parameter validation failed',
        urlInfo: {
          pathname: '/api/v1/users/invalid-id',
          query: {
            page: '1',
          },
          errorType: expect.any(String),
        },
        suggestion: 'Check your URL parameters',
      },
    })

    // Test query parameter error
    const result2 = await router.run({
      pathname: '/api/v1/users/123',
      query: {
        page: 'invalid-page',
      },
    })

    expect(result2.info.body).toEqual({
      type: 'json',
      value: {
        error: 'URL parameter validation failed',
        urlInfo: {
          pathname: '/api/v1/users/123',
          query: {
            page: 'invalid-page',
          },
          errorType: expect.any(String),
        },
        suggestion: 'Check your URL parameters',
      },
    })
  })

  it('supports calling next in onSchemaError to continue matching', async () => {
    const router = Router()

    router
      .get(
        '/posts/<id:int>',
        {},
        {
          onSchemaError: (error, input, next) => {
            return next()
          },
        },
      )
      .use((request) => {
        return Response.json(request)
      })

    router.get('/posts/<slug:string>', {}).use((request) => {
      return Response.json(request)
    })

    const result = await router.run({
      method: 'GET',
      pathname: '/posts/123',
    })

    expect(result.info.body).toEqual({
      type: 'json',
      value: {
        method: 'GET',
        params: {
          id: 123,
        },
        pathname: '/posts/123',
      },
    })

    const result2 = await router.run({
      method: 'GET',
      pathname: '/posts/abc',
    })

    expect(result2.info.body).toEqual({
      type: 'json',
      value: {
        method: 'GET',
        params: {
          slug: 'abc',
        },
        pathname: '/posts/abc',
      },
    })
  })
})

describe('Router useLazy', () => {
  it('should support lazy loading middleware with sync function', async () => {
    const router = Router()
    let middlewareLoaded = false

    const matchedPipeline = router.match({
      pathname: '/test',
      query: {
        id: Number,
      },
    })

    matchedPipeline.useLazy(() => {
      middlewareLoaded = true
      return (request, next) => {
        return Response.json({
          message: 'Lazy loaded middleware',
          id: request.query.id,
          pathname: request.pathname,
        })
      }
    })

    // Middleware should not be loaded yet
    expect(middlewareLoaded).toBe(false)

    const result = await router.run({
      pathname: '/test',
      query: {
        id: '123',
      },
    })

    // Middleware should be loaded after first request
    expect(middlewareLoaded).toBe(true)
    expect(result.info.body).toEqual({
      type: 'json',
      value: {
        message: 'Lazy loaded middleware',
        id: 123,
        pathname: '/test',
      },
    })
  })

  it('should support lazy loading middleware with async function', async () => {
    const router = Router()
    let middlewareLoaded = false
    let loadCount = 0

    const matchedPipeline = router.match({
      pathname: '/test',
      method: 'POST',
      body: {
        data: String,
      },
    })

    matchedPipeline.useLazy(async () => {
      // Simulate async loading
      await new Promise((resolve) => setTimeout(resolve, 10))
      middlewareLoaded = true
      loadCount++

      return (request, next) => {
        return Response.json({
          message: 'Async lazy loaded middleware',
          data: request.body.data,
          loadCount,
        })
      }
    })

    // Middleware should not be loaded yet
    expect(middlewareLoaded).toBe(false)
    expect(loadCount).toBe(0)

    const result = await router.run({
      pathname: '/test',
      method: 'POST',
      body: {
        data: 'test-data',
      },
    })

    // Middleware should be loaded after first request
    expect(middlewareLoaded).toBe(true)
    expect(loadCount).toBe(1)
    expect(result.info.body).toEqual({
      type: 'json',
      value: {
        message: 'Async lazy loaded middleware',
        data: 'test-data',
        loadCount: 1,
      },
    })

    // Second request should reuse the loaded middleware
    const result2 = await router.run({
      pathname: '/test',
      method: 'POST',
      body: {
        data: 'test-data-2',
      },
    })

    expect(loadCount).toBe(1) // Should not load again
    expect(result2.info.body).toEqual({
      type: 'json',
      value: {
        message: 'Async lazy loaded middleware',
        data: 'test-data-2',
        loadCount: 1,
      },
    })
  })

  it('should support multiple lazy middleware in sequence', async () => {
    const router = Router()
    const executionOrder: string[] = []

    const matchedPipeline = router.match({
      pathname: '/test/:id',
      params: {
        id: Number,
      },
    })

    matchedPipeline.useLazy(() => {
      executionOrder.push('lazy1-loaded')
      return (request, next) => {
        executionOrder.push('lazy1-executed')
        return next(request)
      }
    })

    matchedPipeline.useLazy(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      executionOrder.push('lazy2-loaded')
      return (request, next) => {
        executionOrder.push('lazy2-executed')
        return next(request)
      }
    })

    matchedPipeline.use((request) => {
      executionOrder.push('final-handler')
      return Response.json({
        message: 'Final handler',
        id: request.params.id,
        executionOrder,
      })
    })

    const result = await router.run({
      method: 'GET',
      pathname: '/test/123',
    })

    expect(executionOrder).toEqual([
      'lazy1-loaded',
      'lazy1-executed',
      'lazy2-loaded',
      'lazy2-executed',
      'final-handler',
    ])

    expect(result.info.body).toEqual({
      type: 'json',
      value: {
        message: 'Final handler',
        id: 123,
        executionOrder: ['lazy1-loaded', 'lazy1-executed', 'lazy2-loaded', 'lazy2-executed', 'final-handler'],
      },
    })
  })
})
