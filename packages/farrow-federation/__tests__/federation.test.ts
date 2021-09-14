import { Http } from 'farrow-http'
import { service as foo } from './fixtures/foo'
import { service as bar } from './fixtures/bar'
import { services as baz } from './fixtures/baz'
import { createFederationServices } from '../src'
import supertest, { Response } from 'supertest'

describe('farrow-federation', () => {
  const http = Http()

  http.route('/foo').use(foo)
  http.route('/bar').use(bar)
  http.use(baz)

  it('Introspection', async () => {
    const federationService = await createFederationServices(
      [
        {
          url: '/foo',
          namespace: 'foo',
        },
        {
          url: '/bar',
          namespace: 'bar',
        },
        {
          url: '/greet',
          namespace: 'greet',
        },
        {
          url: '/todo',
          namespace: 'todo',
        },
      ],
      {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fetch: async (input, init) => {
          const getRes = () =>
            new Promise<Response>((resolve) =>
              supertest(http.server())
                .post(input as string)
                .send(JSON.parse(init!.body! as any))
                .then(resolve),
            )
          const res = await getRes()
          return {
            json() {
              return JSON.parse(res.text)
            },
          }
        },
      },
    )

    const server = Http()

    server.use(federationService)
    const res = await supertest(server.handle).post('/').send({
      type: 'Introspection',
    })

    expect(res.body).toMatchSnapshot()
  })

  it('pass through', async () => {
    const federationService = await createFederationServices(
      [
        {
          url: '/foo',
          namespace: 'foo',
        },
        {
          url: '/bar',
          namespace: 'bar',
        },
        {
          url: '/greet',
          namespace: 'greet',
        },
        {
          url: '/todo',
          namespace: 'todo',
        },
      ],
      {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fetch: async (input, init) => {
          const getRes = () =>
            new Promise<Response>((resolve) =>
              supertest(http.server())
                .post(input as string)
                .send(JSON.parse(init!.body! as any))
                .then(resolve),
            )
          const res = await getRes()
          return {
            json() {
              return JSON.parse(res.text)
            },
          }
        },
      },
    )

    const server = Http()

    server.use(federationService)
    const res = await supertest(server.handle)
      .post('/')
      .send({
        type: 'Single',
        path: ['foo', 'getTodos'],
        input: { id: 'foo' },
      })

    expect(res.body.type).toBe('ApiSuccessResponse')
    expect(typeof res.body.output).toBe('object')
    expect(Array.isArray(res.body.output.todos)).toBeTruthy()
    expect(res.body.output.todos.length).toBe(3)
  })

  it('mutiple', async () => {
    const federationService = await createFederationServices(
      [
        {
          url: '/foo',
          namespace: 'foo',
        },
        {
          url: '/bar',
          namespace: 'bar',
        },
        {
          url: '/greet',
          namespace: 'greet',
        },
        {
          url: '/todo',
          namespace: 'todo',
        },
      ],
      {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fetch: async (input, init) => {
          const getRes = () =>
            new Promise<Response>((resolve) =>
              supertest(http.server())
                .post(input as string)
                .send(JSON.parse(init!.body! as any))
                .then(resolve),
            )
          const res = await getRes()
          return {
            json() {
              return JSON.parse(res.text)
            },
          }
        },
      },
    )

    const server = Http()

    server.use(federationService)
    const res = await supertest(server.handle)
      .post('/')
      .send({
        type: 'Single',
        path: ['bar', 'getTodos'],
        input: { id: 'foo' },
      })

    expect(res.body.type).toBe('ApiSuccessResponse')
    expect(typeof res.body.output).toBe('object')
    expect(Array.isArray(res.body.output.todos)).toBeTruthy()
    expect(res.body.output.todos.length).toBe(3)
  })

  it('nest', async () => {
    const federationService = await createFederationServices(
      [
        {
          url: '/foo',
          namespace: 'foo',
        },
        {
          url: '/bar',
          namespace: 'bar',
        },
        {
          url: '/greet',
          namespace: 'greet',
        },
        {
          url: '/todo',
          namespace: 'todo',
        },
      ],
      {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fetch: async (input, init) => {
          const getRes = () =>
            new Promise<Response>((resolve) =>
              supertest(http.server())
                .post(input as string)
                .send(JSON.parse(init!.body! as any))
                .then(resolve),
            )
          const res = await getRes()
          return {
            json() {
              return JSON.parse(res.text)
            },
          }
        },
      },
    )

    const server = Http()

    server.use(federationService)
    const res = await supertest(server.handle)
      .post('/')
      .send({
        type: 'Single',
        path: ['greet', 'greet'],
        input: { name: 'farrow' },
      })

    expect(res.body.type).toBe('ApiSuccessResponse')
    expect(typeof res.body.output).toBe('object')
    expect(res.body.output.greet).toBe('Hello farrow!')
  })
})
