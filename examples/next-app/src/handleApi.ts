import { apiPipeline } from './api/todo'

apiPipeline.use(async (request, next) => {
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
