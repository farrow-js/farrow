import type { HttpPipeline } from 'farrow-http'
import type { Middleware } from 'koa'

export const adapter = (httpPipeline: HttpPipeline): Middleware => {
  return async (ctx, next) => {
    await httpPipeline.handle(ctx.req, ctx.res, {
      onLast: async () => {
        await next()
      },
    })
  }
}
