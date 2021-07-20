# farrow-koa

Adapter for `farrow-http` in [koa](https://github.com/koajs/koa) app.

## Setup

Install via npm or yarn

```sh
# via npm
npm install --save farrow-koa

# via yarn
yarn add farrow-koa
```

Usage

Create a `farrow-http` app first:

```ts
import { Http } from 'farrow-http'

const http = Http()

http
  .match({
    pathname: '/test',
  })
  .use((data) => {
    return Response.text(JSON.stringify(data))
  })
```

And then create a express app:

```ts
import Koa from 'koa'

const PORT = 3000

const app = new Koa()

app.use(async (ctx) => {
  ctx.body = 'Hello World'
})

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
```

and combine them:

```ts
import Koa from 'koa'
import { Http } from 'farrow-http'
import { adapter } from 'farrow-koa'

const PORT = 3000

const http = Http()

http
  .match({
    pathname: '/test',
  })
  .use((data) => {
    return Response.text(JSON.stringify(data))
  })

const app = new Koa()

app.use(adapter(http))

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
```

Then, you can use work with farrow stack in a koa app.

Or, you can combine them by `koa-router` to a specific route path in koa app.
