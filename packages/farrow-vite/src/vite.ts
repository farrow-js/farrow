import path from 'path'
import fs from 'fs/promises'
import { constants } from 'fs'
import { Response, Router, RouterPipeline, CustomBodyHandler } from 'farrow-http'
import { createServer as createViteServer, ViteDevServer, InlineConfig } from 'vite'

export type ViteRouterPipeline = RouterPipeline & {
  close(): Promise<void>
}

export type FarrowViteOptions = InlineConfig & {
  onBeforeSendHtml?: (html: string) => string
}

export const vite = (options?: FarrowViteOptions): ViteRouterPipeline => {
  const router = Router()

  const config = {
    ...options,
  }

  let viteDevServers: ViteDevServer[] = []

  router.useLazy(async () => {
    const viteServer = await createViteServer({
      server: {
        ...config.server,
        middlewareMode: true,
      },
      ...config,
    })

    const getHtmlPath = async (url: string): Promise<string> => {
      const pathname = url.split('?')[0]
      /**
       * pathname.slice(1) is to remove the first '/'
       * /dir/file.html => dir/file.html
       * path.join('/root', 'dir/file.html') => /root/dir/file.html
       */
      const filename = path.join(viteServer.config.root, pathname.slice(1))

      if (filename.endsWith('.html')) {
        return filename
      }

      const maybeHtmlPath = `${filename}/index.html`
      try {
        await fs.access(maybeHtmlPath, constants.R_OK)
        return `${filename}/index.html`
      } catch (error) {
        // if subfolder has no index.html found, use the root folder's instead
        return `${viteServer.config.root}/index.html`
      }
    }

    const handler: CustomBodyHandler = ({ req, res }) => {
      viteServer.middlewares(req, res, async () => {
        try {
          const url = req.url ?? '/'
          const htmlPath = await getHtmlPath(url)
          const fileContent = await fs.readFile(htmlPath, 'utf-8')
          const html = await viteServer.transformIndexHtml(url, fileContent)

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          res.end(options?.onBeforeSendHtml?.(html) ?? html)
        } catch (error: any) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/plain')
          }

          const message = process.env.NODE_ENV === 'production' ? error.message : error.stack ?? error.message

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
      const servers = [...viteDevServers]

      viteDevServers = []

      await Promise.all(servers.map((server) => server.close()))
    },
  }
}
