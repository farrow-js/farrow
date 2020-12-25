import { Middleware } from 'farrow-pipeline'
import { Response, useReq, useRes, MaybeAsyncResponse } from 'farrow-http'
import { promisify } from 'util'

import Cors, { CorsOptions, CorsOptionsDelegate, CorsRequest } from 'cors'

export { CorsOptions, CorsOptionsDelegate, CorsRequest }

export const cors = <T extends CorsRequest = CorsRequest>(
  options?: CorsOptions | CorsOptionsDelegate<T>,
): Middleware<any, MaybeAsyncResponse> => {
  let cors = promisify(
    Cors({
      ...options,
      preflightContinue: true,
    }),
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
      } else {
        return next(request)
      }
    } catch (error) {
      return Response.status(500).text(error.message)
    }
  }
}
