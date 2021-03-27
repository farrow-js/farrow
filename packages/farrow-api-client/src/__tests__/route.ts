import { ApiError, ApiSuccess } from 'farrow-api-server'
import { apiPipeline } from '../index'

apiPipeline.use(async (request, next) => {
  let calling = {
    ...request.calling,
    fromUseForBody: true,
  }

  let options: RequestInit = {
    ...request.options,
    headers: {
      ...request.options?.headers,
      'from-use-for-header': '1',
    },
  }

  let response = await next({
    ...request,
    calling,
    options,
  })

  return {
    ...response,
    fromUseForResponse: true,
  }
})

apiPipeline.match('/match/success', async (request, next) => {
  let calling = {
    ...request.calling,
    fromMatchStringForBody: true,
  }

  let options: RequestInit = {
    ...request.options,
    headers: {
      ...request.options?.headers,
      'from-match-string-for-header': '1',
    },
  }

  let response = await next({
    ...request,
    calling,
    options,
  })

  return {
    ...response,
    fromMatchStringForResponse: true,
  }
})

apiPipeline.match(/regexp/i, async (request, next) => {
  let calling = {
    ...request.calling,
    fromMatchRegexpForBody: true,
  }

  let options: RequestInit = {
    ...request.options,
    headers: {
      ...request.options?.headers,
      'from-match-regexp-for-header': '1',
    },
  }

  let response = await next({
    ...request,
    calling,
    options,
  })

  return {
    ...response,
    fromMatchRegexpForResponse: true,
  }
})

apiPipeline.use((input) => {
  let data = {
    url: input.url,
    body: input.calling as any,
    headers: input.options?.headers as Record<string, string>,
  }

  if (input.url === '/use/success') {
    return ApiSuccess({ data, a: 1 })
  }

  if (input.url === '/match/success') {
    return ApiSuccess({ data, a: 1 })
  }

  if (input.url === '/match/error') {
    return ApiError('/match/error')
  }

  if (input.url === '/regexp/success') {
    return ApiSuccess({
      data,
      b: 1,
    })
  }

  if (input.url === '/regexp/error') {
    return ApiError('/regexp/error')
  }

  return ApiError('handler not found')
})
