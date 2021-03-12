import { useContext } from 'react'
import { ReactRenderContext } from './Context'

export const usePrefix = () => {
  let ctx = useRenderContext()

  return ctx.basenames.join('')
}

export const useRenderContext = () => {
  let ctx = useContext(ReactRenderContext)

  if (!ctx) {
    throw new Error(`You may forget to add farrow context provider`)
  }

  return ctx
}
