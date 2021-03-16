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

[farrow-api](../farrow-api/README.md) just defining API, it's not directly bind to a server.

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

In client-side, for consuming data we need to use [farrow-api-client](../farrow-api-client/README.md).

```typescript
// import file codegened by farrow
import { api as TodoApi } from '../api/todo'

const main = async () => {
  // invoke api
  let result = await TodoApi.addTodo({
    content: 'todo content',
  })
}
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
