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
  const html = ReactDOMServer.renderToString(element)
  const docType = options?.docType ?? defaultDocType

  return Response.html(`${docType}\n${html}`)
}

export const renderToNodeStream = <T extends JSX.Element>(element: T, options?: ReactResponseOptions) => {
  const contentStream = ReactDOMServer.renderToNodeStream(element)
  const docType = options?.docType ?? defaultDocType

  const docTypeStream = new Stream.Readable({
    read() {
      this.push(`${docType}\n`)
      this.push(null)
    },
  })

  const stream = new (MultiStream as any)([docTypeStream, contentStream])

  return Response.type('html').stream(stream)
}

export type ReactViewOptions = ReactResponseOptions & {
  useStream?: boolean
}

export const useReactView = (options?: ReactViewOptions) => {
  const basenames = Http.useBasenames()

  const config = {
    useStream: true,
    ...options,
  }

  const render = <T extends JSX.Element>(element: T) => {
    const context: ReactRenderContext = {
      basenames,
    }

    const view = <ReactRenderContext.Provider value={context}>{element}</ReactRenderContext.Provider>

    if (config.useStream) {
      return renderToNodeStream(view)
    }

    return renderToString(view)
  }

  return {
    render,
  }
}
