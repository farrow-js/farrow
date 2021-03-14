import { Middleware } from 'farrow-pipeline'
import { Response, useReq, useRes, MaybeAsyncResponse } from 'farrow-http'
import { promisify } from 'util'

import Cors, { CorsOptions, CorsOptionsDelegate, CorsRequest } from 'cors'
import { IncomingMessage } from 'http'

export { CorsOptions, CorsOptionsDelegate, CorsRequest }

export const cors = (
  options?: CorsOptions | CorsOptionsDelegate<IncomingMessage>,
): Middleware<any, MaybeAsyncResponse> => {
  let cors = promisify(
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
    let req = useReq()
    let res = useRes()

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
    } catch (error) {
      return Response.status(500).text(error.message)
    }
  }
}
