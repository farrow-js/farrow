import { useContext } from 'react'
import { ReactRenderContext } from './Context'

export const usePrefix = () => {
  const ctx = useRenderContext()

  return ctx.basenames.join('')
}

export const useRenderContext = () => {
  const ctx = useContext(ReactRenderContext)

  if (!ctx) {
    throw new Error(`You may forget to add farrow context provider`)
  }

  return ctx
}
