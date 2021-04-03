import path from 'path'
import fs from 'fs/promises'
import { constants } from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'
import { Response, Router, RouterPipeline } from 'farrow-http'
import { createServer as createViteServer, ViteDevServer, InlineConfig } from 'vite'

export type ViteRouterPipeline = RouterPipeline & {
  close(): Promise<void>
}

export const vite = (options?: InlineConfig): ViteRouterPipeline => {
  let router = Router()

  let config = {
    ...options,
  }

  let viteDevServers: ViteDevServer[] = []

  router.useLazy(async () => {
    let viteServer = await createViteServer({
      server: {
        ...config.server,
        middlewareMode: true,
      },
      ...config,
    })

    let getHtmlPath = async (url: string): Promise<string> => {
      let filename = path.join(viteServer.config.root, url.slice(1))

      if (filename.endsWith('.html')) {
        return filename
      }

      let maybeHtmlPath = `${filename}/index.html`
      try {
        await fs.access(maybeHtmlPath, constants.R_OK)
        return `${filename}/index.html`
      } catch (error) {
        // if subfolder has no index.html found, use the root folder's instead
        return `${viteServer.config.root}/index.html`
      }
    }

    let handler = ({ req, res }: { req: IncomingMessage; res: ServerResponse }) => {
      viteServer.middlewares(req, res, async () => {
        try {
          let url = req.url ?? '/'
          let htmlPath = await getHtmlPath(url)
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

    viteDevServers.push(viteServer)

    return () => {
      return Response.custom(handler)
    }
  })

  return {
    ...router,
    async close() {
      let servers = [...viteDevServers]

      viteDevServers = []

      await Promise.all(servers.map((server) => server.close()))
    },
  }
}
