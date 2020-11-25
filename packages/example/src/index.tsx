import path from 'path'

import React from 'react'

import { Http, Router, Response, usePrefix } from 'farrow-http'
import * as Schema from 'farrow-schema'
import { useReactView } from 'farrow-react'
import { Link } from 'farrow-react/Link'

const home = Router({
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

home.use(async (request) => {
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

const detail = Router({
  pathname: '/:detailId',
  params: {
    detailId: Number,
  },
  query: {
    tab: Schema.Nullable(String),
  },
})

detail.use(async (request) => {
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

const attachment = Router({
  pathname: '/src/index.js',
})

attachment.use(async () => {
  let filename = path.join(__dirname, '../index.js')
  return Response.file(filename).attachment('bundle.js')
})

const Query = Schema.Struct({
  a: Schema.Nullable(Number),
  b: Schema.Nullable(String),
  c: Schema.Nullable(Boolean),
})

type Query = Schema.TypeOf<typeof Query>

const View = (props: { pathname: string; query: Query }) => {
  return (
    <div id="root">
      <h1>Hello React</h1>
      <Link href="/">link</Link>
      <div style={{ fontSize: 18, color: 'red' }}>
        <pre>{JSON.stringify(props, null, 2)}</pre>
      </div>
    </div>
  )
}

const react = Router({
  pathname: '/react',
  query: Query,
})

react.use(async (request) => {
  let ReactView = useReactView()

  return ReactView.render(<View {...request} />).header('view-engine', 'react')
})

const http = Http({
  basenames: ['/base'],
})

http.serve('/static', __dirname)

http.use(home)

http.use('/detail', detail)

http.use(react)

http.use(attachment)

const server = http.listen(3002, () => {
  console.log('server start at port: 3002')
})
