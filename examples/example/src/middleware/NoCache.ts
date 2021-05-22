import { Middleware } from 'farrow-pipeline'
import { MaybeAsyncResponse } from 'farrow-http'

export const NoCache = (): Middleware<any, MaybeAsyncResponse> => async (request, next) => {
  const response = await next(request)
  return response.header('Cache-control', 'no-store')
}
