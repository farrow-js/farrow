import path from 'path'
import fs from 'fs/promises'
import { IncomingMessage, ServerResponse } from 'http'
import { Http, Response, Router } from 'farrow-http'
import { cors } from 'farrow-cors'
import { service as TodoService } from './api/todo'

import { createServer as createViteServer, InlineConfig } from 'vite'

type FarrowViteOptions = {
  indexHtml?: string
  viteConfig?: InlineConfig
}

const vite = (options?: FarrowViteOptions) => {
  let router = Router()

  let config = {
    indexHtml: path.resolve('index.html'),
    ...options,
  }

  let viteServerPromise = createViteServer({
    server: {
      ...config.viteConfig?.server,
      middlewareMode: true,
    },
    ...config.viteConfig,
  })

  let handleIndexHtml = async (url: string) => {
    let viteServer = await viteServerPromise
    let fileContent = await fs.readFile(config.indexHtml, 'utf-8')
    let html = await viteServer.transformIndexHtml(url, fileContent)
    return Response.html(html)
  }

  let handler = async ({ req, res }: { req: IncomingMessage; res: ServerResponse }) => {
    let viteServer = await viteServerPromise

    viteServer.middlewares(req, res, () => {
      res.statusCode = 404
      res.end()
    })
  }

  router.get('/').use((request) => {
    return handleIndexHtml(request.pathname)
  })

  router.get('/index.html').use((request) => {
    return handleIndexHtml(request.pathname)
  })

  router.use(() => {
    return Response.custom(handler)
  })

  return router
}

let http = Http()

http.route('/api/todo').use(cors()).use(TodoService)

if (process.env.NODE_ENV === 'production') {
  http.serve('/', path.join(__dirname, '../dist/client'))
} else if (process.env.NODE_ENV === 'development') {
  http.use(vite())
}

http.listen(3002, () => {
  console.log('server started at http://localhost:3002')
})
