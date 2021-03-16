# farrow-http

A Type-Friendly Web Framework

## Benefits

- Expressive HTTP middleware like [Koa](https://github.com/koajs/koa) but no need to modify `req/res` or `ctx`
- Strongly typed and type-safe from request to response via powerful schema-based validation
- Provide React-Hooks-like mechanism which is useful for reusing code and integrating other parts of Server like database connection
- Easy to learn and use if you were experienced in expressjs/koajs

![farrow](./docs/assets/farrow.png)

## Environment Requirement

- TypeScript 4.2
- Node.js 14.0.0

## Usage

- [How to install](#how-to-install)
- [How to setup a development environment](#how-to-setup-a-development-environment)
- [How to setup a server](#how-to-setup-a-server)
- [How to serve static assets](#how-to-serve-static-assets)
- [How to respond text or json or html or file](#how-to-respond-text-or-json-or-html-or-file)
- [How to access request info](#how-to-access-request-info)
- [How to match specific request](#how-to-match-specific-request)
- [How to pass new request info for downstream middleware](#how-to-pass-new-request-info-for-downstream-middleware)
- [How to filter and manipulate response in upstream middleware](#how-to-filter-and-manipulate-response-in-upstream-middleware)
- [How to set response headers](#how-to-set-response-headers)
- [How to set response cookies](#how-to-set-response-cookies)
- [How to set response status](#how-to-set-response-status)
- [How to redirect](#how-to-redirect)
- [How to merge responses](#how-to-merge-responses)
- [How to add router](#how-to-add-router)
- [How to add view-engine](#how-to-add-view-engine)
- [How to write a farrow hooks](#how-to-write-a-farrow-hooks)

### How to install

```shell
# via npm
npm install --save farrow farrow-pipeline farrow-schema farrow-http

# via yarn
yarn add farrow farrow-pipeline farrow-schema farrow-http
```

### How to setup a development environment

add `scripts` to your `package.json`

```json
{
  "scripts": {
    "dev": "farrow dev",
    "build": "farrow build",
    "start": "farrow start"
  }
}
```

and then:

- `npm run dev` for developing
- `npm run build` for bundling the source code
- `npm run start` for runing the output code of bundler

`farrow` assumes that your source code is in `src` folder, and the output code is in `dist` folder.

You can use `farrow.config.js` to change the default configuration, see the [documentation](./packages/farrow/README.md) for more detail.

### How to setup a server

```typescript
import { Http, Response } from 'farrow-http'

const http = Http()

// add http middleware
http.use(() => {
  // returning response in middleware
  return Response.text(`Hello Farrow`)
})

http.listen(3000)
```

### How to serve static assets

```typescript
http.serve('/static', dirname)
```

### How to respond text or json or html or file

```typescript
// respond text
http.use(() => {
  return Response.text(`Farrow`)
})

// respond json
http.use(() => {
  return Response.json({
    farrow: true,
    data: {},
  })
})

// respond html
http.use(() => {
  return Response.html(`<h1>Farrow</h1>`)
})

// respond file
http.use(() => {
  return Response.file(filename)
})
```

### How to access request info

```typescript
http.use((request) => {
  // access request pathname
  console.log('pathname', request.pathname)

  // access request method
  console.log('method', request.method)

  // access request query
  console.log('query', request.query)

  // access request body
  console.log('body', request.body)

  // access request headers
  console.log('headers', request.headers)

  // access request cookies
  console.log('cookies', request.cookies)
})
```

### How to match specific request

Click [Router-Url-Schema](#router-url-schema) to read more

```typescript
// http.match(schema).use(...middlewares)
// farrow will validate request info and extract the data for middlewares
// schema has the similar shape like request info: { pathname, method, query, body, headers, cookies, params }
// the params is readed from path-to-regexp if you config schema.pathname to be /product/:id, and params is equal to { id }
// learn more about pathname: https://github.com/pillarjs/path-to-regexp#usage
http
  .match({
    pathname: '/product',
    // if method was not given, the default value wounld be `GET`.
    query: {
      productId: Number,
    },
  })
  .use((request) => {
    // productId is a number
    console.log('productId', request.query.productId)
  })

// or using routing-methods
http.get('/get0/<arg0:int>?<arg1:int>').use((request) => {
  return Response.json({
    type: 'get',
    request,
  })
})
```

### How to pass new request info for downstream middleware

```typescript
http.use((request, next) => {
  // no need to modify the request, just calling next(new_request) with a new request info
  return next({
    ...request,
    pathname: '/fixed',
  })
})

http.use((request) => {
  // request pathname will be '/fixed'
  console.log('pathname', request.pathname)
})
```

### How to filter and manipulate response in upstream middleware

```typescript
http.use(async (request, next) => {
  // next() returning response received from downstream
  let response = await next()
  let headers = {
    'header-key': 'header-value',
  }
  // filter or merge response and return
  return Response.headers(headers).merge(response)
})

http.use(async (request) => {
  return Response.json(request)
})
```

### How to set response headers

```typescript
http.use(() => {
  return Response.header('a', '1').header('b', '2').text('ok')
})

// or

http.use(() => {
  return Response.headers({
    a: '1',
    b: '2',
  }).text('ok')
})
```

### How to set response cookies

```typescript
http.use(() => {
  return Response.cookie('a', '1').cookie('b', '2').text('ok')
})

// or

http.use(() => {
  return Response.cookies({
    a: '1',
    b: '2',
  }).text('ok')
})
```

### How to set response status

```typescript
http.use(() => {
  return Response.status(404, 'Not Found').html('some text')
})
```

### How to redirect

```typescript
http.use(() => {
  return Response.redirect(targetUrl)
})
```

### How to merge responses

```typescript
let response0 = Response.status(200)
let response1 = Response.header('a', '1')
let response2 = Response.header('b', '2')
let response3 = Response.cookie('c', '3')

let response = Response.merge(response0, response1, response2, response3)
// or
let response = response0.merge(response1, response2, response3)
```

### How to add router

`Router()` has the same methods like `Http()` except `http.listen(...)` and `http.server()`

```typescript
import { Http, Router, Response } from 'farrow-http'

// create http
const http = Http()

// create product router
const product = Router()

// create user router
const user = Router()

// add sub route for product
http.route('/product').use(product)

// add sub route for user
http.route('/user').use(user)

http.listen(3000)

// handle product router
// this will match /product/:id
product.get('/<id:int>').use(async (request) => {
  return Response.json({
    productId: request.params.id,
  })
})

// this will match /product/info
product.get('/info').use(async (request) => {
  return Response.json({
    productInfo: {},
  })
})

// handle user router
// this will match /user/:id
user.get('/<id:int>').use(async (request) => {
  return Response.json({
    userId: request.params.id,
  })
})

// this will match /user/info
user.get('/info').use(async (request) => {
  return Response.json({
    userInfo: {},
  })
})
```

### How to add view-engine

`Farrow` provide an official server-side rendering library based on `React`, but you can implement your own via `Response.html(...)` or `Response.stream(...)`.

```shell
# via npm
npm install --save react react-dom farrow-react

# via yarn
yarn add react react-dom farrow-react
```

```tsx
import React from 'react'
import { useReactView } from 'farrow-react'
// use Link to auto prefix basename came from http.route(name, ...) or router.route(name, ...)
import { Link } from 'farrow-react/Link'

http.use(() => {
  let ReactView = useReactView({
    docType: '<!doctype html>', // optional, specify the doctype in html response
    useStream: true, // optional, if ture it will use ReactDOMServer.renderToNodeStream internally
  })

  return ReactView.render(
    <>
      <h1>Hello Farrow-React</h1>
      <Link href="/">Home</Link>
    </>,
  )
})
```

### How to write a farrow hooks

[Click here to learn more.](./packages/farrow-pipeline/README.md#createcontextdefaultvalue-t-context)

```tsx
import { createContext } from 'farrow-pipeline'
import { Http, HttpMiddleware } from 'farrow-http'
import { useReactView } from 'farrow-react'

// declare an interface
interface User {
  id: string
  name: string
  email: string
}

// define a farrow context via interface
const UserContext = createContext<User | null>(null)

// define a provider middleware
const UserProvider = (): HttpMiddleware => {
  return async (request, next) => {
    // assume defining somewhere
    let session = SessionContext.get()
    let db = DbContext.get()

    if (!request?.cookies?.token) {
      return next()
    }

    let userId = await session.read(request?.cookies?.token)

    let user = await db.query({
      User: {
        token,
      },
    })

    UserContext.set(user)

    return next()
  }
}

const http = Http()

http.use(UserProvider())

http
  .match({
    pathname: '/userinfo',
  })
  .use(async (request, next) => {
    let ReactView = useReactView()
    // assert context value is not null or undefined and return context value
    let user = UserContext.assert()

    return ReactView.render(<div>{JSON.stringify(user)}</div>)
  })
```

## API

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

## Router-Url-Schema

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

### Dynamic parameter

A dynamic parameter has the form `<key:type>`.

- if it was placed in `pathname`(before `?` in a url), it will regard as `params[key] = type`. the order is matter
- if it was placed in `querystring`(after `?` in a url), it will regard as `query[key] = type`. the order is't matter

Dynamic parameter support `modifier`(learn more from [here](https://github.com/pillarjs/path-to-regexp#modifiers)), has the form:

- `<key?:type>` means optional, the corresponding type is `{ key?: type }`, the corresponding pattern is `/:key?`
- `<key*:type>` means zero or more, the corresponding type is `{ key?: type[] }`, the corresponding pattern is `/:key*`
- `<key+:type>` means one or more, the corresponding type is `{ key: type[] }`, the corresponding pattern is `/:key+`

### Static parameter

A static parameter can only be placed in `querystring`, it will regard as `literal string type`.

For example: `/?<a:int>&b=2` has the type `{ pathname: string, query: { a: number, b: '2' } }`

### Current supported types in `router-url-schema`

The supported types in `<key:type>` are list below:

- `string` -> ts `string`
- `number` -> ts `number`
- `boolean` -> ts `boolean`
- `id` -> ts `string`, but `farrow-schema` will ensure it's not empty
- `int` -> ts `number`, but `farrow-schema` will ensure it's integer
- `float` -> ts `number`
- `{*+}` -> use the string wrapped by `{}` as `string literal type`. eg. `{abc}` has type `"abc"`, only `string literal type` is supported
- `|` -> ts `union types`. eg. `<a:int|boolean|string>` has ts type `number|boolean|string`

## Routing methods

`router[get|post|put|patch|head|delte|options](url, schema?, options?)` is supported as shortcut of `router.match({ url, method: get|post|put|patch|head|delte|options }, options?)`

```typescript
router.get('/get0/<arg0:int>?<arg1:int>').use((request) => {
  return Response.json({
    type: 'get',
    request,
  })
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
  basenames: ['/base0'],
})
http.route('/base1').use(() => {
  // basenames will be ['/base0', '/base1'] if user accessed /base0/base1
  let basenames = useBasenames().value
  return Response.json({ basenames })
})
```

## usePrefix(): string

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
