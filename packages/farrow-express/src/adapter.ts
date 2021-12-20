import type { HttpPipeline } from 'farrow-http'
import type { RequestHandler } from 'express'

export const adapter = (httpPipeline: HttpPipeline): RequestHandler => {
  return (req, res, next) => {
    return httpPipeline.handle(req, res, {
      onLast: () => {
        next()
      },
    })
  }
}
