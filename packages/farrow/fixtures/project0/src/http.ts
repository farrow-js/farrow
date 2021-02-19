import { Http, Response } from 'farrow-http'
import { service } from './api'

export const http = Http({
  logger: false,
})

http.get('/user/<id:int>').use((request) => {
  return Response.json({
    user: {
      id: request.params.id,
    },
  })
})

http.get('/env/<key:string>').use((request) => {
  return Response.json({
    [request.params.key]: process.env[request.params.key],
  })
})

http.get('/env').use(() => {
  return Response.json({
    env: process.env,
  })
})

http.route('/api').use(service)
