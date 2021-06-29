import type { HttpPipeline } from 'farrow-http'
import type { RequestHandler } from 'express'

export const adapter = (httpPipeline: HttpPipeline): RequestHandler => {
  return async (req, res, next) => {
    await httpPipeline.handle(req, res, {
      onLast: () => {
        next()
      },
    })
  }
}
