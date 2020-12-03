import { HttpMiddleware, RedirectOptions } from 'farrow-http'

export const Action2Api = (redirectUrl = '/', options?: RedirectOptions): HttpMiddleware => async (request, next) => {
  if (!request.pathname.startsWith('/action')) {
    return next(request)
  }

  let response = await next({
    ...request,
    pathname: request.pathname.replace('/action', '/api'),
  })

  return response.redirect(redirectUrl, options)
}
