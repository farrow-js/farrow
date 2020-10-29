import path from 'path'

import React from 'react'

import { Middleware } from 'farrow-core'
import { createHttpPipeline, Response, usePrefix, createRouterPipeline } from 'farrow-http'
import { object, number, string, nullable, list, boolean, RawType } from 'farrow-schema'
import { useReactView } from 'farrow-react'

const home = createRouterPipeline({
  pathname: '/',
})

home.match('html', (body) => {
  return Response.html(`
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
    </head>
    <body>
      ${body.value}
    </body>
    </html>
`)
})

home.add(async (request) => {
  let prefix = usePrefix()

  return Response.html(`
    <h1>Home:${request.pathname}</h1>
    <ul>
      <li>
        <a href="${prefix}/detail/1">detail 1</a>
      </li>
      <li>
        <a href="${prefix}/detail/2">detail 2</a>
      </li>
      <li>
        <a href="${prefix}/detail/3">detail 3</a>
      </li>
      <li>
        <a href="${prefix}/detail/4">detail 4</a>
      </li>
      <li>
        <a href="${prefix}/detail/5">detail 5</a>
      </li>
      <li>
      <a href="${prefix}/detail/6">detail 6</a>
    </li>
    </ul>
  `)
})

const detail = createRouterPipeline({
  pathname: '/:detailId',
  params: object({
    detailId: number,
  }),
  query: object({
    tab: nullable(string),
  }),
})

detail.add(async (request) => {
  let prefix = usePrefix()

  if (request.params.detailId > 4) {
    return Response.redirect(`/3?tab=from=${request.params.detailId}`)
  }

  return Response.json({
    prefix: prefix,
    pathname: request.pathname,
    detailId: request.params.detailId,
    tab: request.query.tab,
  })
})

const attachment = createRouterPipeline({
  pathname: '/src/index.js',
})

attachment.add(async () => {
  let filename = path.join(__dirname, '../index.js')
  return Response.file(filename).attachment('bundle.js')
})

const query = object({
  a: nullable(number),
  b: nullable(string),
  c: nullable(boolean),
})

type Query = RawType<typeof query>

const View = (props: { pathname: string; query: Query }) => {
  return (
    <div id="root">
      <h1>Hello React</h1>
      <div style={{ fontSize: 18, color: 'red' }}>
        <pre>{JSON.stringify(props, null, 2)}</pre>
      </div>
    </div>
  )
}

const react = createRouterPipeline({
  pathname: '/react',
  query: query,
})

react.add(async (request) => {
  let ReactView = useReactView()

  return ReactView.render(<View {...request} />).header('view-engine', 'react')
})

const http = createHttpPipeline({
  basenames: ['/base'],
  logger: true,
})

http.serve('/static', __dirname)

http.add(home.middleware)

http.add('/detail', detail.middleware)

http.add(react.middleware)

http.add(attachment.middleware)

const server = http.listen(3002, () => {
  console.log('server start at port: 3002')
})
