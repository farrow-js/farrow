import React from 'react'

import { useReactView } from 'farrow-react'

export type LayoutProps = {
  title?: string
  keywords?: string[]
  description?: string
}

export const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>{props.title ?? ''}</title>
        <meta name="description" content={props.description ?? ''}></meta>
        <meta name="keywords" content={props.keywords?.join() ?? ''} />
        <link rel="stylesheet" href="/static/css/mvp.css" />
      </head>
      <body>{props.children}</body>
    </html>
  )
}

export const useLayoutView = () => {
  let ReactView = useReactView()

  let render = <T extends JSX.Element>(element: T, props?: LayoutProps) => {
    return ReactView.render(<Layout {...props}>{element}</Layout>)
  }

  return {
    render,
  }
}
