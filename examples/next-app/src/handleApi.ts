import { apiPipeline } from 'farrow-api-client'

apiPipeline.match('/todo', async (request, next) => {
  let body = {
    ...request.body,
    token: 'abc',
  }

  let options: RequestInit = {
    headers: {
      'x-access-token': 'abc',
    },
  }

  let response = await next({
    ...request,
    body,
    options,
  })

  return response
})
