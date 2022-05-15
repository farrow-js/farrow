# farrow-express

Adapter for `farrow-http` in [express](https://github.com/expressjs/express) app.

## Setup

Install via npm or yarn

```sh
# via npm
npm install --save farrow-express

# via yarn
yarn add farrow-express
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
import express from 'express'

const PORT = 3000

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
```

and combine them:

```ts
import express from 'express'
import { Http } from 'farrow-http'
import { adapter } from 'farrow-express'

const PORT = 3000

const http = Http()

http
  .match({
    pathname: '/test',
  })
  .use((data) => {
    return Response.text(JSON.stringify(data))
  })

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/farrow', adapter(http))

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
```

Then, you can use work with farrow stack under route path `/farrow` in a express app.
