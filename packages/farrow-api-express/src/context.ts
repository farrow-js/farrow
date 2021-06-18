import { createContext } from 'farrow-pipeline'
import { Request, Response, NextFunction } from 'express'

export const RequestContext = createContext<Request | null>(null)

export const useRequest = () => {
  const request = RequestContext.use().value
  return request
}

export const ResponseContext = createContext<Response | null>(null)

export const useResponse = () => {
  const response = ResponseContext.use().value

  return response
}

export const NextContext = createContext<NextFunction | null>(null)

export const useNext = () => {
  const response = NextContext.use().value

  return response
}
