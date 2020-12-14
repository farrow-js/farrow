# Farrow Http Docs

```typescript
import {
  Http, // use to create http
  Response, // use to respond user
  Router, // use to create router
  useReq, // farrow-hooks for accessing the original request of node.js http module
  useRes, // farrow-hooks for accessing the original response of node.js http module
  useRequestInfo, // farrow-hooks for accessing the request info
  useBasenames, // farrow-hooks for accessing the basename list
  usePrefix, // farrow-hooks for accessing the prefix string which is euqal basenames.join('')
} from 'farrow-http'
```

## Http(options?: HttpPipelineOptions): HttpPipeline

create a http

```typescript
type HttpPipelineOptions = {
  // basename list, farrow-http will cut the basename from request.pathname
  basenames?: string[]
  // options for parsing req body, learn more: https://github.com/cojs/co-body#options
  body?: BodyOptions
  // options for parsing req cookies, learn more: https://github.com/jshttp/cookie#options
  cookie?: CookieOptions
  // options for parsing req query, learn more: https://github.com/ljharb/qs
  query?: QueryOptions
  // injecting contexts per request
  contexts?: (params: {
    req: IncomingMessage
    requestInfo: RequestInfo
    basename: string
  }) => ContextStorage | Promise<ContextStorage>
  // enable log or not
  logger?: boolean | LoggerOptions
}

// learn more about RouterPipeline below.
type HttpPipeline = RouterPipeline & {
  // http.handle(req, res), handle request and respond to user, you can use this function to make farrow-http work in expressjs/koajs or other web framework in node.js
  handle: (req: IncomingMessage, res: ServerResponse) => Promise<void>
  // the same args of http.createServer().listen(...), create a server and listen to port
  listen: (...args: Parameters<Server['listen']>) => Server
  // just create a server with http.handle(req, res), don't listen to any port
  server: () => Server
}

// logger options
type LoggerOptions = {
  // handle logger result string
  transporter?: (str: string) => void
}
```

## Response

`Response` can be used to describe the shape of the real server response, farrow-http will perform it later

```typescript
type ResponseInfo = {
  status?: Status
  headers?: Headers
  cookies?: Cookies
  body?: Body
  vary?: string[]
}

type Response = {
  // response info
  info: ResponseInfo
  // merger all responses
  merge: (...responses: Response[]) => Response
  // set json response body
  json: (value: JsonType) => Response
  // set html response body
  html: (value: string) => Response
  // set text response body
  text: (value: string) => Response
  // set raw response body without content-type
  raw: (value: string) => Response
  // redirect response
  redirect: (url: string, options?: { usePrefix?: boolean }) => Response
  // set stream response body
  stream: (stream: Stream) => Response
  // set file response body
  file: (filename: string) => Response
  // set vary header fields
  vary: (...fileds: string[]) => Response
  // set response cookie
  cookie: (name: string, value: string | number | null, options?: Cookies.SetOption) => Response
  // set response cookies
  cookies: (cookies: { [key: string]: string | number | null }, options?: Cookies.SetOption) => Response
  // set response header
  header: (name: string, value: Value) => Response
  // set response headers
  headers: (headers: Headers) => Response
  // set response status
  status: (code: number, message?: string) => Response
  // set buffer response body
  buffer: (buffer: Buffer) => Response
  // set empty content response body
  empty: () => Response
  // set attachment response header
  attachment: (filename?: string) => Response
  // set custom response body
  custom: (handler?: CustomBodyHandler) => Response
  // set content-type via mime-type/extname
  type: (type: string) => Response
}
```

## Router(): RouterPipeline

create a router

```typescript
// learn more about Pipeline from Farrow-Pipeline API: https://github.com/Lucifier129/farrow/blob/master/docs/pipeline.md
type RouterPipeline = Pipeline<RequestInfo, MaybeAsyncResponse> & {
  // capture the response body if the specific type is matched, should returning response in callback function
  capture: <T extends keyof BodyMap>(type: T, callback: (body: BodyMap[T]) => MaybeAsyncResponse) => void
  // add sub route and return a route-pipeline which can handle the matched request info
  route: (name: string) => Pipeline<RequestInfo, MaybeAsyncResponse>
  // serve static assets
  serve: (name: string, dirname: string) => void
  // match specific request via router-request-schema and return a schema-pipeline which can handle the matched request info
  match: <T extends RouterRequestSchema>(
    schema: T,
    options?: MatchOptions,
  ) => Pipeline<TypeOfRequestSchema<T>, MaybeAsyncResponse>
}

type RouterRequestSchema = {
  // match pathname of req via https://github.com/pillarjs/path-to-regexp
  pathname: Pathname
  // match method of req.method, default is GET, supports multiple methods as array
  method?: string | string[]
  // match the params parsed by path-to-regexp
  params?: RouterSchemaDescriptor
  // match the req query
  query?: RouterSchemaDescriptor
  // match the req body
  body?: Schema.FieldDescriptor | Schema.FieldDescriptors
  // match the req headers
  headers?: RouterSchemaDescriptor
  // match the rqe cookies
  cookies?: RouterSchemaDescriptor
}

type MatchOptions = {
  // if true, it will throw error when there are no middlewares handle the request, or it will calling next()
  block: boolean
}

const router = Router()

// all fileds of router-request-schema list below
// learn more about Schema Builder from Farrow-Schema API: https://github.com/Lucifier129/farrow/blob/master/docs/schema.md
router
  .match({
    pathname: '/product/:id',
    method: 'POST',
    params: {
      id: Number,
    },
    query: {
      a: Number,
      b: String,
      c: Boolean,
    },
    body: {
      a: Number,
      b: String,
      c: Boolean,
    },
    headers: {
      a: Number,
      b: String,
      c: Boolean,
    },
    cookies: {
      a: Number,
      b: String,
      c: Boolean,
    },
  })
  .use(async (request) => {
    console.log('request', request)
  })
```

## useReq(): IncomingMessage

```typescript
http.use(() => {
  // original request
  let req = useReq()
})
```

## useRes(): ServerResponse

```typescript
http.use(() => {
  // original response
  let res = useRes()
})
```

## useRequestInfo(): RequestInfo

```typescript
http.use((request0) => {
  // request1 in here is equal to request0, but we can calling useRequestInfo in any custom hooks
  let request1 = useRequestInfo()
})
```

## useBasenames(): string[]

```typescript
const http = Http({
  basename: ['/base0'],
})
http.route('/base1', () => {
  // basenames will be ['/base0', '/base1'] if user accessed /base0/base1
  let basenames = useBasenames()
})
```

## usePrefix(): string

```typescript
const http = Http({
  basename: ['/base0'],
})

http.route('/base1', () => {
  // prefix will be '/base0/base1' if user accessed /base0/base1
  let prefix = usePrefix()
})
```
