import { createHttpPipeline, RequestInfo } from './http'
import {
  html,
  status,
  json,
  text,
  TextResponser,
  HTMLResponser,
  StatusResponser,
  JsonResponser,
} from './http/responser'
import { createRouterPipeline } from './http/router'
import { object, number, string, nullable, createType, Err, Ok } from './core/schema'
import { createCell, Middleware, useCell } from './core/pipeline'
import { Request } from 'node-fetch'

const logger: Middleware<any, any> = async (request, next) => {
  let start = Date.now()
  let response = await next(request)
  let end = Date.now()
  let time = (end - start).toFixed(2)
  console.log(`path: ${request.pathname}, time: ${time}ms`)
  return response
}

const NotFound = () => {
  return status({
    code: 404,
  })
}

const home = createRouterPipeline({
  pathname: '/',
})

home.add(async (request, next) => {
  let response = await next(request)

  if (!html.is(response)) {
    return response
  }

  return html(`
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
    </head>
    <body>
      ${response.value}
    </body>
    </html>
  `)
})

home.add(async (request) => {
  return html(`
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
  return json({
    pathname: request.pathname,
    detailId: request.params.detailId,
    tab: request.query.tab,
  })
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
  responsers: [JsonResponser, TextResponser, StatusResponser, HTMLResponser],
  contexts: {
    history: HistoryCell.create([]),
  },
})

app.add(logger)
app.add(history)

app.add(home.middleware)
app.add(detail.middleware)

app.add(NotFound)

const server = app.listen(3002, () => {
  console.log('server start at port: 3002')
})

server
