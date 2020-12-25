import { Http, Response } from 'farrow-http'
import supertest from 'supertest'
import { cors } from '../index'

/* -------------------------------------------------------------------------- */

let simpleApp = Http({
  logger: false,
})

simpleApp
  .match({
    pathname: '/',
    method: 'HEAD',
  })
  .use(cors())
  .use(() => {
    return Response.status(204)
  })

simpleApp
  .match({
    pathname: '/',
    method: 'GET',
  })
  .use(cors())
  .use(() => {
    return Response.text('Hello World (Get)')
  })

simpleApp
  .match({
    pathname: '/',
    method: 'POST',
  })
  .use(cors())
  .use(() => {
    return Response.text('Hello World (Post)')
  })

/* -------------------------------------------------------------------------- */

let complexApp = Http({
  logger: false,
})

complexApp
  .match({
    pathname: '/',
    method: 'OPTIONS',
  })
  .use(cors())
  .use(() => {
    return Response.status(204)
  })

complexApp
  .match({
    pathname: '/',
    method: 'DELETE',
  })
  .use(cors())
  .use(() => {
    return Response.text('Hello World (Delete)')
  })

let simpleServer = simpleApp.server()
let complexServer = complexApp.server()

/* -------------------------------------------------------------------------- */

describe('example app(s)', function () {
  describe('simple methods', function () {
    it('GET works', async () => {
      await supertest(simpleServer)
        .get('/')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*')
        .expect('Hello World (Get)')
    })
    it('HEAD works', async () => {
      await supertest(simpleServer).head('/').expect(204).expect('Access-Control-Allow-Origin', '*')
    })
    it('POST works', async () => {
      await supertest(simpleServer)
        .post('/')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*')
        .expect('Hello World (Post)')
    })
  })

  describe('complex methods', function () {
    it('OPTIONS works', async () => {
      await supertest(complexServer).options('/').expect(204).expect('Access-Control-Allow-Origin', '*')
    })

    it('DELETE works', async () => {
      await supertest(complexServer)
        .del('/')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*')
        .expect('Hello World (Delete)')
    })
  })
})
