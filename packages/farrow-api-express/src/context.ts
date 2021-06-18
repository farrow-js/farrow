import { createContext } from 'farrow-pipeline'
import { Request, Response, NextFunction } from 'express'

export const RequestContext = createContext<Request | null>(null)

export const useRequest = () => {
  const request = RequestContext.use().value

  if (!request) {
    throw new Error(`Can't call useRequest out of scope, it should be placed on top of the function`)
  }

  return request
}

export const ResponseContext = createContext<Response | null>(null)

export const useResponse = () => {
  const response = ResponseContext.use().value

  if (!response) {
    throw new Error(`Can't call useResponse out of scope, it should be placed on top of the function`)
  }

  return response
}

export const NextContext = createContext<NextFunction | null>(null)

export const useNext = () => {
  const next = NextContext.use().value

  if (!next) {
    throw new Error(`Can't call useNext out of scope, it should be placed on top of the function`)
  }

  return next
}
