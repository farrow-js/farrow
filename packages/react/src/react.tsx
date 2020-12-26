import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { Stream } from 'stream'
import MultiStream from 'multistream'

import * as Http from 'farrow-http'

import { ReactRenderContext } from './Context'

const { Response } = Http

export type ReactResponseOptions = {
  docType?: string
}

export const defaultDocType = `<!doctype html>`

export const renderToString = <T extends JSX.Element>(element: T, options?: ReactResponseOptions) => {
  let html = ReactDOMServer.renderToString(element)
  let docType = options?.docType ?? defaultDocType

  return Response.html(`${docType}\n${html}`)
}

export const renderToNodeStream = <T extends JSX.Element>(element: T, options?: ReactResponseOptions) => {
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
  let basenames = Http.useBasenames().value

  let config = {
    useStream: true,
    ...options,
  }

  let render = <T extends JSX.Element>(element: T) => {
    let context: ReactRenderContext = {
      basenames,
    }

    let view = <ReactRenderContext.Provider value={context}>{element}</ReactRenderContext.Provider>

    if (config.useStream) {
      return renderToNodeStream(view)
    }

    return renderToString(view)
  }

  return {
    render,
  }
}
