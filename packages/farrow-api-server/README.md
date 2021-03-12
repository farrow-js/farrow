# farrow-api-server

**farrow-api-server**: farrow-api adapter for farrow-http

## Setup

Install via npm or yarn

```shell
# via npm
npm install --save farrow-api-server

# via yarn
yarn add farrow-api-server
```

## Usage

`farrow-api` just defining API, it's not directly bind to an server.

`farrow-api-server` can convert an `api-entries` to a router of `farrow-http`.

In servier-side, we define api/service via `farrow-api`, and attach them to `farrow-http`

```typescript
// /src/api/todo.ts
import { ApiService } from 'farrow-api-server'

// assuming addTodo/removeTodo is defined

// combine all api to an object/entries
export const entries = {
  addTodo,
  removeTodo,
}

// create service router
export const service = ApiService({
  entries,
})
```

```typescript
// /src/api/index.ts
import { Response, Router } from 'farrow-http'
// import todo-service
import { service as TodoService } from './todo'

export const services = Router()

// capture all json response and do something if needed
services.capture('json', (body) => {
  if (typeof body.value === 'object') {
    return Response.json({
      ...body.value,
      // ...others
    })
  }
  return Response.json(body.value)
})

// attach todo api to services
services.route('/api/todo').use(TodoService)

// attach user api to services if existed
// services.route('/api/user').use(UserService)
```

```typescript
import path from 'path'
import { Http } from 'farrow-http'
import { vite } from 'farrow-vite'

import { services } from './api'

let http = Http()

// attach services to http
http.use(services)

http.listen(3000, () => {
  console.log('server started at http://localhost:3002')
})
```

In client-side, we need to implement a fetcher for calling `api-services`, it's better to use [farrow](./farrow.md) to codegen the `api-client`

```typescript
// client-side

type ApiErrorResponse = {
  error: {
    message: string
  }
}

type ApiSuccessResponse = {
  output: JsonType
  // ...others
}

type ApiResponse = ApiErrorResponse | ApiSuccessResponse

export const fetcher = async (input) => {
  let options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }
  let response = await fetch(`http://localhost:3000/api/todo`, options)
  /**
   * api-service will return ApiResponse
   * the server can return more data/fields for other purposes
   */
  let json = (await response.json()) as ApiResponse

  if ('error' in json) {
    throw new Error(json.error.message)
  } else {
    return json.output
  }
}

// calling addTodo
fetcher({
  // specify the path of api in api-entries
  path: ['addTodo'],
  // pass the input of api to server
  input: {
    content: 'todo content',
  },
})

// calling removeTodo
fetcher({
  path: ['removeTodo'],
  input: {
    id: 0,
  },
})
```

## API

```typescript
type CreateApiServiceOptions = {
  // api entries
  entries: ApiEntries
  /**
   * should display error.stack or not
   * it will be true if process.env.NODE_ENV === 'production' by default
   */
  errorStack?: boolean
}
const ApiService: (options: CreateApiServiceOptions) => ApiServiceType
```
