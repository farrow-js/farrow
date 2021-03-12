import React from 'react'

export type ReactRenderContext = {
  basenames: string[]
}

export const ReactRenderContext = React.createContext<ReactRenderContext | null>(null)
