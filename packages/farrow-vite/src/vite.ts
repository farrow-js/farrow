import path from 'path'
import fsm from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'
import { Response, Router } from 'farrow-http'
import { createServer as createViteServer, InlineConfig } from 'vite'

const fs = fsm.promises

export const vite = (options?: InlineConfig) => {
  let router = Router()

  let config = {
    ...options,
  }

  router.useLazy(async () => {
    let viteServer = await createViteServer({
      server: {
        ...config.server,
        middlewareMode: true,
      },
      ...config,
    })

    let getHtmlPath = (url: string): string => {
      let filename = path.join(viteServer.config.root, url.slice(1))

      if (filename.endsWith('.html')) {
        return filename
      }

      return `${filename}/index.html`
    }

    let handler = ({ req, res }: { req: IncomingMessage; res: ServerResponse }) => {
      viteServer.middlewares(req, res, async () => {
        try {
          let url = req.url ?? '/'
          let htmlPath = getHtmlPath(url)
          let fileContent = await fs.readFile(htmlPath, 'utf-8')
          let html = await viteServer.transformIndexHtml(url, fileContent)

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
        } catch (error) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/plain')
          }

          let message = process.env.NODE_ENV === 'production' ? error.message : error.stack ?? error.message

          res.statusCode = 500
          res.end(message ?? '')
        }
      })
    }

    return () => {
      return Response.custom(handler)
    }
  })

  return router
}
