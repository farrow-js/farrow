# farrow-http

A Type-Friendly Web Framework

## Table of Content

- [API](#api)
  - [Http(options?: HttpPipelineOptions): HttpPipeline](#httpoptions-httppipelineoptions-httppipeline)
  - [Https(options?: HttpsPipelineOptions): HttpsPipeline](#httpsoptions-httpspipelineoptions-httpspipeline)
  - [Response](#response)
  - [Router(): RouterPipeline](#router-routerpipeline)
    - [Router-Url-Schema](#router-url-schema)
      - [Dynamic parameter](#dynamic-parameter)
      - [Static parameter](#static-parameter)
      - [Current supported types in `router-url-schema`](#current-supported-types-in-router-url-schema)
    - [Routing methods](#routing-methods)
  - [useReq(): IncomingMessage](#usereq-incomingmessage)
  - [useRes(): ServerResponse](#useres-serverresponse)
  - [useRequestInfo(): RequestInfo](#userequestinfo-requestinfo)
  - [useBasenames(): string[]](#usebasenames-string)
  - [usePrefix(): string](#useprefix-string)

## API

```typescript
import {
  Http, // use to create http server
  Https, // use to create https server
  Response, // use to respond user
  Router, // use to create router
  useReq, // farrow-hooks for accessing the original request of node.js http module
  useRes, // farrow-hooks for accessing the original response of node.js http module
  useRequestInfo, // farrow-hooks for accessing the request info
  useBasenames, // farrow-hooks for accessing the basename list
  usePrefix, // farrow-hooks for accessing the prefix string which is euqal basenames.join('')
} from 'farrow-http'
```

### Http(options?: HttpPipelineOptions): HttpPipeline

create a http server

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
  logger?: boolean | HttpLoggerOptions
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

type HttpLoggerOptions = LoggerOptions & {
  /**
   * it should ignore the introspection request log or not
   * default is true
   */
  ignoreIntrospectionRequestOfFarrowApi?: boolean
}
```

### Https(options?: HttpsPipelineOptions): HttpsPipeline

create a https server

```ts
export type HttpsOptions = SecureContextOptions & TlsOptions

export type HttpsPipelineOptions = HttpPipelineOptions & {
  // Intersection between options from tls.createServer() and tls.createSecureContext() in Node.js
  tsl?: HttpsOptions
}

type HttpsPipeline = RouterPipeline & {
  // https.handle(req, res), handle request and respond to user, you can use this function to make farrow-http work in expressjs/koajs or other web framework in node.js
  handle: (req: IncomingMessage, res: ServerResponse) => Promise<void>
  // the same args of https.createServer().listen(...), create a server and listen to port
  listen: (...args: Parameters<Server['listen']>) => Server
  // just create a server with https.handle(req, res), don't listen to any port
  server: () => Server
}
```

- tls <[HttpsOptions](https://github.com/Lucifier129/farrow/blob/6c0208e0f9e3e3015042caf4f001717750800602/packages/farrow-http/src/https.ts#L22)>
  Intersection between options from [tls.createServer()](https://nodejs.org/dist/latest-v15.x/docs/api/tls.html#tls_tls_createserver_options_secureconnectionlistener) and [tls.createSecureContext()](https://nodejs.org/dist/latest-v15.x/docs/api/tls.html#tls_tls_createsecurecontext_options) in [Node.js](https://nodejs.org/)

> Notes: Server created by http is different from created by https.

### Response

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
  // check response content type
  // response.is('json') => 'json' | false
  is: (...types: string[]) => string | false
  // merger all responses
  merge: (...responses: Response[]) => Response
  // set string response body
  string: (value: string) => Response
  // set json response body
  json: (value: JsonType) => Response
  // set html response body
  html: (value: string) => Response
  // set text response body
  text: (value: string) => Response
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

### Router(): RouterPipeline

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
  // match the req cookies
  cookies?: RouterSchemaDescriptor
}

type MatchOptions = {
  // if true, it will throw error when there are no middlewares handle the request, or it will calling next()
  block?: boolean
  // if given, it will be called when Router-Request-Schema was failed, if it returned Response in sync or async way, that would be the final response of middleware
  onSchemaError?(error: ValidationError): Response | void | Promise<Response | void>
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

#### Router-Url-Schema

Since farrow `v1.2.0`, a new feature `router-url-schema` is supported. it combines `{ pathname, params, query }` into `{ url }`, and use [Template literal types](https://devblogs.microsoft.com/typescript/announcing-typescript-4-1-beta/#template-literal-types) to extract the type info

```typescript
// the same schema as above but in a more compact form
router
  .match({
    url: '/product/<id:number>?<a:number>&<b:string>&<c:boolean>',
    method: 'POST',
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

##### Dynamic parameter

A dynamic parameter has the form `<key:type>`.

- if it was placed in `pathname`(before `?` in a url), it will regard as `params[key] = type`. the order is matter
- if it was placed in `querystring`(after `?` in a url), it will regard as `query[key] = type`. the order is't matter

Dynamic parameter support `modifier`(learn more from [here](https://github.com/pillarjs/path-to-regexp#modifiers)), has the form:

- `<key?:type>` means optional, the corresponding type is `{ key?: type }`, the corresponding pattern is `/:key?`
- `<key*:type>` means zero or more, the corresponding type is `{ key?: type[] }`, the corresponding pattern is `/:key*`
- `<key+:type>` means one or more, the corresponding type is `{ key: type[] }`, the corresponding pattern is `/:key+`

##### Static parameter

A static parameter can only be placed in `querystring`, it will regard as `literal string type`.

For example: `/?<a:int>&b=2` has the type `{ pathname: string, query: { a: number, b: '2' } }`

##### Current supported types in `router-url-schema`

The supported types in `<key:type>` are list below:

- `string` -> ts `string`
- `number` -> ts `number`
- `boolean` -> ts `boolean`
- `id` -> ts `string`, but `farrow-schema` will ensure it's not empty
- `int` -> ts `number`, but `farrow-schema` will ensure it's integer
- `float` -> ts `number`
- `{*+}` -> use the string wrapped by `{}` as `string literal type`. eg. `{abc}` has type `"abc"`, only `string literal type` is supported
- `|` -> ts `union types`. eg. `<a:int|boolean|string>` has ts type `number|boolean|string`

#### Routing methods

`router[get|post|put|patch|head|delte|options](url, schema?, options?)` is supported as shortcut of `router.match({ url, method: get|post|put|patch|head|delte|options }, options?)`

```typescript
router.get('/get0/<arg0:int>?<arg1:int>').use((request) => {
  return Response.json({
    type: 'get',
    request,
  })
})
```

### useReq(): IncomingMessage

```typescript
http.use(() => {
  // original request
  let req = useReq()
})
```

### useRes(): ServerResponse

```typescript
http.use(() => {
  // original response
  let res = useRes()
})
```

### useRequestInfo(): RequestInfo

```typescript
http.use((request0) => {
  // request1 in here is equal to request0, but we can calling useRequestInfo in any custom hooks
  let request1 = useRequestInfo()
})
```

### useBasenames(): string[]

```typescript
const http = Http({
  basenames: ['/base0'],
})
http.route('/base1').use(() => {
  // basenames will be ['/base0', '/base1'] if user accessed /base0/base1
  let basenames = useBasenames().value
  return Response.json({ basenames })
})
```

### usePrefix(): string

```typescript
const http = Http({
  basenames: ['/base0'],
})

http.route('/base1').use(() => {
  // prefix will be '/base0/base1' if user accessed /base0/base1
  let prefix = usePrefix()
  return Response.json({ prefix })
})
```
