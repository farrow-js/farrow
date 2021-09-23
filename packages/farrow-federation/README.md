# farrow-federation

A aggregation tool for farrow-api.

It expands from farrow-api-service and get them together to a new and fully-cover services.

## Install

```sh
npm install farrow-federation

yarn add farrow-federation
```

## Frist Look

```ts
import { Http } from 'farrow-http'
import { Federation } from 'farrow-federation'

const http = Http()

const service = await Federation([
  {
    // anthor farrow-api-server entry
    url: 'http://localhost:3001/api/todo',
    namespace: 'todo',
  },
])

http.use(service)

http.listen(3000)
```

In this demo, the federation service only group one service that is at http://localhost:3001/api/todo. But as you might expect, it can group more service created by farrow-api-service. It also be a service, so it can group themselves.

## Services

```ts
export type ApiService = {
  url: string
  namespace: string
}

export type ApiServices = ApiService[]
```

this option for you to pass the all service you want to get together.

The `url` is the service entry and the `namespace` is the namespace of this service entry in current federation.

## Options

### fetch

```ts
fetch?: (input: RequestInfo, init?: RequestInit | undefined) => Promise<globalThis.Response>
```

For customing fetch.

Default: [node-fetch](https://github.com/node-fetch/node-fetch).

### fetcher

```ts
fetcher?: ((request: ApiSingleRequest) => Promise<ApiResponseSingle>) &
((request: ApiIntrospectionRequest) => Promise<ApiResponseSingle>) &
((request: ApiBatchRequest) => Promise<ApiResponseBatch>)
```

For customing the function which sends the calling request.

Default: [createFetcher](https://github.com/tqma113/farrow-federation/blob/59c824aa5ecaedfa28d37127e727b2a354cb371d/src/helpers.ts#L6)

### polling

```ts
polling?: boolean
```

Polling switch.

Default: `false`.

### pollingInterval

```ts
pollingInterval?: number
```

Polling interval time(ms).

Default: `3000`.

### errorStack

```ts
errorStack?: boolean
```

Should display error.stack or not.

Default: `process.env.NODE_ENV !== 'production'`.

### strict

```ts
strict: true
```

Should throw error when connect to services or not.

Default: `true`

Suggestion: `false` in development, `true` in production.
