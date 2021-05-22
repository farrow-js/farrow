import { apiPipeline } from './api/todo'

apiPipeline.use(async (request, next) => {
  const body = {
    ...request.body,
    token: 'abc',
  }

  const options: RequestInit = {
    headers: {
      'x-access-token': 'abc',
    },
  }

  const response = await next({
    ...request,
    body,
    options,
  })

  return response
})
