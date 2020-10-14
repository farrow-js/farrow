import path from 'path'
import { createHttpPipeline, RequestInfo } from './http'
import { Response } from './http/response'
import { createRouterPipeline } from './http/router'
import { object, number, string, nullable, list } from './core/schema'
import { createCell, Middleware, useCell } from './core/pipeline'
import { DirnameCell } from './http/dirname'
import { basename } from './http/basename'
import * as Res from './http/responseInfo'
import { assert } from 'console'

const logger: Middleware<any, any> = async (request, next) => {
  let start = Date.now()
  let response = await next(request)
  let end = Date.now()
  let time = (end - start).toFixed(2)
  console.log(`path: ${request.pathname}, time: ${time}ms`)
  return response
}

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
  return Response.html(`
    <h1>Home:${request.pathname}</h1>
    <ul>
      <li>
        <a href="/detail/1">detail 1</a>
      </li>
      <li>
        <a href="/detail/2">detail 2</a>
      </li>
      <li>
        <a href="/detail/3">detail 3</a>
      </li>
    </ul>
  `)
})

const detail = createRouterPipeline({
  pathname: '/detail/:detailId',
  params: object({
    detailId: number,
  }),
  query: object({
    tab: nullable(string),
  }),
})

detail.add(async (request) => {
  return Response.json({
    pathname: request.pathname,
    detailId: request.params.detailId,
    tab: request.query.tab,
  })
})

const files = createRouterPipeline({
  pathname: '/static/:pathname*',
  params: object({
    pathname: list(string),
  }),
})

files.add(async (request) => {
  let filename = request.params.pathname.join('/')
  return Response.file(filename)
})

const attachment = createRouterPipeline({
  pathname: '/src/index.js',
})

attachment.add(async () => {
  return Response.file('index.js').attachment('bundle.js')
})

const HistoryCell = createCell([] as string[])

const useHistory = () => {
  let cell = useCell(HistoryCell)

  return {
    push: (pathname: string) => {
      cell.value.push(pathname)
      console.log('history', cell.value)
    },
  }
}

const history: Middleware<RequestInfo, any> = async (request, next) => {
  let history = useHistory()
  let response = await next()
  history.push(request.pathname)
  return response
}

const app = createHttpPipeline({
  contexts: {
    history: HistoryCell.create([]),
    dirname: DirnameCell.create(__dirname),
  },
})

app.add(basename('/base'))

app.add(logger)
app.add(history)

app.add(home.middleware)
app.add(detail.middleware)

app.add(attachment.middleware)

app.add(files.middleware)

const server = app.listen(3002, () => {
  console.log('server start at port: 3002')
})
