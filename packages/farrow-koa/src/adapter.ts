import type { HttpPipeline } from 'farrow-http'
import type { Middleware } from 'koa'

export const adapter = (httpPipeline: HttpPipeline): Middleware => {
  return (ctx, next) => {
    return httpPipeline.handle(ctx.req, ctx.res, {
      onLast: () => {
        return next()
      },
    })
  }
}
