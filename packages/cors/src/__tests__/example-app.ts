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
    it('GET works', function (done) {
      supertest(simpleServer)
        .get('/')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*')
        .expect('Hello World (Get)')
        .end(done)
    })
    it('HEAD works', function (done) {
      supertest(simpleServer).head('/').expect(204).expect('Access-Control-Allow-Origin', '*').end(done)
    })
    it('POST works', function (done) {
      supertest(simpleServer)
        .post('/')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*')
        .expect('Hello World (Post)')
        .end(done)
    })
  })

  describe('complex methods', function () {
    it('OPTIONS works', function (done) {
      supertest(complexServer).options('/').expect(204).expect('Access-Control-Allow-Origin', '*').end(done)
    })
    it('DELETE works', function (done) {
      supertest(complexServer)
        .del('/')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*')
        .expect('Hello World (Delete)')
        .end(done)
    })
  })
})
