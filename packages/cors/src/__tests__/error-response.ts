import { Http, Response } from 'farrow-http'
import supertest from 'supertest'
import { cors } from '../index'

let http = Http({
  logger: false,
})

let app = http.server()

http.use(cors())

http
  .match({
    pathname: '/five-hundred',
    method: 'POST',
  })
  .use(() => {
    throw new Error('nope')
  })

http
  .match({
    pathname: '/four-oh-one',
    method: 'POST',
  })
  .use(() => {
    return Response.status(401).text('unauthorized')
  })

http
  .match({
    pathname: '/four-oh-four',
    method: 'POST',
  })
  .use(() => {
    return Response.status(404)
  })

/* -------------------------------------------------------------------------- */

describe('error response', function () {
  it('500', function (done) {
    supertest(app)
      .post('/five-hundred')
      .expect(500)
      .expect('Access-Control-Allow-Origin', '*')
      .expect(/nope/i)
      .end(done)
  })

  it('401', function (done) {
    supertest(app)
      .post('/four-oh-one')
      .expect(401)
      .expect('Access-Control-Allow-Origin', '*')
      .expect(/unauthorized/i)
      .end(done)
  })

  it('404', function (done) {
    supertest(app).post('/four-oh-four').expect(404).expect('Access-Control-Allow-Origin', '*').end(done)
  })
})
