import { Http, Response } from 'farrow-http'
import supertest from 'supertest'
import { cors } from '../src/index'

const http = Http({
  logger: false,
})

const app = http.server()

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

describe('error response', () => {
  it('500', async () => {
    await supertest(app).post('/five-hundred').expect(500).expect('Access-Control-Allow-Origin', '*').expect(/nope/i)
  })

  it('401', async () => {
    await supertest(app)
      .post('/four-oh-one')
      .expect(401)
      .expect('Access-Control-Allow-Origin', '*')
      .expect(/unauthorized/i)
  })

  it('404', async () => {
    await supertest(app).post('/four-oh-four').expect(404).expect('Access-Control-Allow-Origin', '*')
  })
})
