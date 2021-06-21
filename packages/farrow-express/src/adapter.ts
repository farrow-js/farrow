import { createAsyncPipeline, createContainer } from 'farrow-pipeline'
import type { HttpPipeline } from 'farrow-http'
import type { RequestHandler } from 'express'

import { RequestContext, ResponseContext, NextContext, useRequest, useResponse } from './context'

export const adapte = (httpPipeline: HttpPipeline): RequestHandler => {
  const pipeline = createAsyncPipeline<void, void>()

  pipeline.use(async () => {
    const req = useRequest()
    const res = useResponse()
    await httpPipeline.handle(req, res)
  })

  return async (req, res, next) => {
    const container = createContainer({
      request: RequestContext.create(req),
      response: ResponseContext.create(res),
      next: NextContext.create(next),
    })

    await pipeline.run(void 0, { container })
  }
}
