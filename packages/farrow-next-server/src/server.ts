import { parse as parseUrl } from 'url'
import { Response, Router, RouterPipeline } from 'farrow-http'
import createNextServer from 'next'

export type NextServer = ReturnType<typeof createNextServer>

export type NextRouterPipeline = RouterPipeline & {
  app: NextServer
}

export const next = (options?: NextServer['options']): NextRouterPipeline => {
  let router = Router()
  let app = createNextServer({
    dev: process.env.NODE_ENV === 'development',
    ...options,
  })

  router.useLazy(async () => {
    let handle = app.getRequestHandler()

    await app.prepare()

    return () => {
      return Response.custom(async ({ req, res }) => {
        let parsedUrl = parseUrl(req.url ?? '', true)
        await handle(req, res, parsedUrl)
      })
    }
  })

  return {
    ...router,
    app,
  }
}
