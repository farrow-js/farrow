import { parse as parseUrl } from 'url'
import { Http, Response } from 'farrow-http'
import next from 'next'

import { services } from './api'

const http = Http({
  logger: {
    ignoreIntrospectionRequestOfFarrowApi: false,
  },
})

const app = next({
  dev: process.env.NODE_ENV === 'development',
})

http.use(services)
http.useLazy(async () => {
  const handle = app.getRequestHandler()
  await app.prepare()
  return () => {
    return Response.custom(async ({ req, res }) => {
      const parsedUrl = parseUrl(req.url ?? '', true)
      await handle(req, res, parsedUrl)
    })
  }
})

http.listen(3002, () => {
  console.log('server started at http://localhost:3002')
})
