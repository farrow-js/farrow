import { ApiErrorResponse, ApiSingleSuccessResponse } from 'farrow-api-server'
import { apiPipeline } from '../src/index'

apiPipeline.use(async (request, next) => {
  const calling = {
    ...request.calling,
    fromUseForBody: true,
  }

  const options: RequestInit = {
    ...request.options,
    headers: {
      ...request.options?.headers,
      'from-use-for-header': '1',
    },
  }

  const response = await next({
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
  const calling = {
    ...request.calling,
    fromMatchStringForBody: true,
  }

  const options: RequestInit = {
    ...request.options,
    headers: {
      ...request.options?.headers,
      'from-match-string-for-header': '1',
    },
  }

  const response = await next({
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
  const calling = {
    ...request.calling,
    fromMatchRegexpForBody: true,
  }

  const options: RequestInit = {
    ...request.options,
    headers: {
      ...request.options?.headers,
      'from-match-regexp-for-header': '1',
    },
  }

  const response = await next({
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
  const data = {
    url: input.url,
    body: input.calling as any,
    headers: input.options?.headers as Record<string, string>,
  }

  if (input.url === '/use/success') {
    return ApiSingleSuccessResponse({ data, a: 1 })
  }

  if (input.url === '/match/success') {
    return ApiSingleSuccessResponse({ data, a: 1 })
  }

  if (input.url === '/match/error') {
    return ApiErrorResponse('/match/error')
  }

  if (input.url === '/regexp/success') {
    return ApiSingleSuccessResponse({
      data,
      b: 1,
    })
  }

  if (input.url === '/regexp/error') {
    return ApiErrorResponse('/regexp/error')
  }

  return ApiErrorResponse('handler not found')
})
