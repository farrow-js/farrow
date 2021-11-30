import { Response, useReq, useRes, MaybeAsyncResponse } from 'farrow-http'
import type { IncomingMessage } from 'http'
import type { Middleware } from 'farrow-pipeline'

import Cors, { CorsOptions, CorsOptionsDelegate, CorsRequest } from 'cors'
import { promisify } from 'util'

export { CorsOptions, CorsOptionsDelegate, CorsRequest }

export const cors = (
  options?: CorsOptions | CorsOptionsDelegate<IncomingMessage>,
): Middleware<any, MaybeAsyncResponse> => {
  const cors = promisify(
    Cors(
      typeof options === 'function'
        ? options
        : {
            ...options,
            preflightContinue: true,
          },
    ),
  )

  return async (request, next) => {
    const req = useReq()
    const res = useRes()

    try {
      await cors(req, res)
      if (req.method?.toLowerCase() === 'options') {
        if (typeof options === 'object') {
          if (options.preflightContinue) {
            return next(request)
          }
        }
        return Response.status(204).string('')
      }
      return next(request)
    } catch (error: any) {
      return Response.status(500).text(error.message)
    }
  }
}
