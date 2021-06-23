import { createAsyncPipeline, createContainer } from 'farrow-pipeline'
import type { HttpPipeline } from 'farrow-http'
import type { Middleware } from 'koa'

import { CtxContext, NextContext, useContext } from './context'

export const adapte = (httpPipeline: HttpPipeline): Middleware => {
  const pipeline = createAsyncPipeline<void, void>()

  pipeline.use(async () => {
    const ctx = useContext()
    await httpPipeline.handle(ctx.req, ctx.res)
  })

  return async (ctx, next) => {
    const container = createContainer({
      request: CtxContext.create(ctx),
      next: NextContext.create(next),
    })

    await pipeline.run(void 0, { container })
  }
}
