# farrow-api-client

**farrow-api-client** is an api-client for `farrow-api-server`

## Installation

```shell
# via npm
npm install --save farrow-api-client

# via yarn
yarn add farrow-api-client
```

## Usage

Using [farrow](../farrow/README.md#example) to codegen the `api-client`, and config apiPipeline if needed.

Simply, we can `import` the file via codegen directly without modification.

If we need to touch request/response, there are two ways.

The first way only affects one url.

```typescript
// import the apiPipeline from target module
import { apiPipeline } from '../api/todo'

/**
 * farrow-api-client is based on farrow-pipeline
 * use pipeline.use(middleware) to do something you want
 */
apiPipeline.use(async (request, next) => {
  /**
   * add extra fileds for post requeset body
   */
  let body = {
    ...request.body,
    token: 'abc',
  }

  /**
   * add extra headers for post request
   */
  let options: RequestInit = {
    headers: {
      'x-access-token': 'abc',
    },
  }

  /**
   * pass new request to next and await for the response
   */
  let response = await next({
    ...request,
    body,
    options,
  })

  // handle the response if needed
  return response
})
```

The second way only affects all urls.

```typescript
// import the apiPipeline from farrow-api-client
import { apiPipeline } from 'farrow-api-client'

// all request performed via farrow-api-client will come here
// it should be handled carefully
apiPipeline.use(async (request, next) => {
  let response = await next(request)
  return response
})

/**
 * match(string | regexp, middleware)
 * match the request url and handle it via farrow-pipeline
 * if pass a string, it will be matched by url.endsWith(pattern)
 * if pass a regexp, it will be matched by pattern.test(url)
 */
apiPipeline.match('/todo', async (request, next) => {
  /**
   * add extra fileds for post requeset body
   */
  let body = {
    ...request.body,
    token: 'abc',
  }

  /**
   * add extra headers for post request
   */
  let options: RequestInit = {
    headers: {
      'x-access-token': 'abc',
    },
  }

  /**
   * pass new request to next and await for the response
   */
  let response = await next({
    ...request,
    body,
    options,
  })

  // handle the response if needed
  return response
})
```

### Api

### apiPipeline

```typescript
export type ApiRequest = {
  url: string
  body: {
    path: string[]
    input: JsonType
  }
  options?: RequestInit
}

export type ApiErrorResponse = {
  error: {
    message: string
  }
}

export type ApiSuccessResponse = {
  output: JsonType
}

export type ApiResponse = ApiErrorResponse | ApiSuccessResponse

export type ApiPipeline = AsyncPipeline<ApiRequest, ApiResponse> & {
  match(pattern: string | RegExp, middleware: Middleware<ApiRequest, MaybeAsync<ApiResponse>>): void
  invoke(url: string, body: ApiRequest['body']): Promise<JsonType>
}

export type ApiPipelineWithUrl = AsyncPipeline<ApiRequest, ApiResponse> & {
  invoke(body: ApiRequest['body']): Promise<JsonType>
}
```
