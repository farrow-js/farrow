import { parse as parseUrl } from 'url'
import { Response, Router, RouterPipeline } from 'farrow-http'
import createNextServer from 'next'

export type NextServer = ReturnType<typeof createNextServer>

export type NextRouterPipeline = RouterPipeline & {
  app: NextServer
}

export const next = (options?: NextServer['options']): NextRouterPipeline => {
  const router = Router()
  const app = createNextServer({
    dev: process.env.NODE_ENV === 'development',
    ...options,
  })

  router.useLazy(() => {
    const handle = app.getRequestHandler()

    return app.prepare().then(() => () => {
      return Response.custom(({ req, res }) => {
        const parsedUrl = parseUrl(req.url ?? '', true)
        return handle(req, res, parsedUrl)
      })
    })
  })

  return {
    ...router,
    app,
  }
}
