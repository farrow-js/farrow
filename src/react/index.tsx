import React, { useContext } from 'react'
import ReactDOMServer from 'react-dom/server'
import { Stream } from 'stream'
import MultiStream from 'multistream'

import * as Http from '../http'

import { Response } from '../http/response'

export type FarrowContext = {
  basenames: string[]
}

export const FarrowContext = React.createContext<FarrowContext | null>(null)

export const useFarrowContext = () => {
  let ctx = useContext(FarrowContext)

  if (!ctx) {
    throw new Error(`You may forget to add farrow context provider`)
  }

  return ctx
}

export const usePrefix = () => {
  let ctx = useFarrowContext()

  return ctx.basenames.join('')
}

export type ReactResponseOptions = {
  docType?: string
}

export const defaultDocType = `<!doctype html>`

export const renderToString = <T extends JSX.Element>(
  element: T,
  options?: ReactResponseOptions
) => {
  let html = ReactDOMServer.renderToString(element)
  let docType = options?.docType ?? defaultDocType

  return Response.html(`${docType}\n${html}`)
}

export const renderToNodeStream = <T extends JSX.Element>(
  element: T,
  options?: ReactResponseOptions
) => {
  let contentStream = ReactDOMServer.renderToNodeStream(element)
  let docType = options?.docType ?? defaultDocType

  let docTypeStream = new Stream.Readable({
    read() {
      this.push(`${docType}\n`)
      this.push(null)
    },
  })

  let stream = new (MultiStream as any)([docTypeStream, contentStream])

  return Response.type('html').stream(stream)
}

export type ReactViewOptions = ReactResponseOptions & {
  useStream?: boolean
}

export const useReactView = (options?: ReactViewOptions) => {
  let basenames = Http.useBasenames()

  let config = {
    ...options,
    useStream: true,
  }

  let render = <T extends JSX.Element>(element: T) => {
    let context: FarrowContext = {
      basenames,
    }

    let view = <FarrowContext.Provider value={context}>{element}</FarrowContext.Provider>

    if (config.useStream) {
      return renderToNodeStream(view)
    } else {
      return renderToString(view)
    }
  }

  return {
    render,
  }
}
