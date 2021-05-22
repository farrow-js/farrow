import { IncomingMessage, ServerResponse } from 'http'
import { createContext } from 'farrow-pipeline'

import type { RequestInfo } from './requestInfo'

export const RequestContext = createContext<IncomingMessage | null>(null)

export const useRequest = () => {
  const request = RequestContext.use().value
  return request
}

export const ResponseContext = createContext<ServerResponse | null>(null)

export const useResponse = () => {
  const response = ResponseContext.use().value

  return response
}

export const useReq = () => {
  const req = useRequest()

  if (!req) {
    throw new Error(`Expected request, but got: ${req}`)
  }

  return req
}

export const useRes = () => {
  const res = useResponse()

  if (!res) {
    throw new Error(`Expected response, but got: ${res}`)
  }

  return res
}

export const RequestInfoContext = createContext<RequestInfo | null>(null)

export const useRequestInfo = () => {
  const requestInfo = RequestInfoContext.use().value

  if (!requestInfo) {
    throw new Error(`Expected request info, but got: ${requestInfo}`)
  }

  return requestInfo
}
