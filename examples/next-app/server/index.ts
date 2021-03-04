import { parse as parseUrl } from 'url'
import { Http, Response } from 'farrow-http'
import next from 'next'

import { services } from './api'

let http = Http()
let app = next({
  dev: process.env.NODE_ENV === 'development',
})

http.use(services)
http.useLazy(async () => {
  let handle = app.getRequestHandler()
  await app.prepare()
  return () => {
    return Response.custom(async ({ req, res }) => {
      let parsedUrl = parseUrl(req.url, true)
      await handle(req, res, parsedUrl)
    })
  }
})

http.listen(3002, () => {
  console.log('server started at http://localhost:3002')
})
