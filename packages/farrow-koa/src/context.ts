import { createContext } from 'farrow-pipeline'
import type { ParameterizedContext, Next } from 'koa'

export const CtxContext = createContext<ParameterizedContext | null>(null)

export const useContext = () => {
  const context = CtxContext.use().value

  if (!context) {
    throw new Error(`Can't call useContext out of scope, it should be placed on top of the function`)
  }

  return context
}

export const NextContext = createContext<Next | null>(null)

export const useNext = () => {
  const next = NextContext.use().value

  if (!next) {
    throw new Error(`Can't call useNext out of scope, it should be placed on top of the function`)
  }

  return next
}
