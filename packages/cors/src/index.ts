// the code is based on https://github.com/expressjs/cors/blob/master/lib/index.js

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
      return next(request)
    } catch (error) {
      return Response.status(500).text(error.message)
    }
  }
}
