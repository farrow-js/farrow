# farrow-vite

**farrow-vite**: Vite adapter for farrow-http

Combining `farrow`, `farrow-http`, `farrow-api` and `farrow-vite`, we can setup a modern full-stack development.

## Usage

`npm install --save-dev vite farrow-vite`

```typescript
import path from 'path'
import { Http } from 'farrow-http'
import { vite } from 'farrow-vite'

import { services } from './api'

let http = Http()

http.use(services)

if (process.env.NODE_ENV === 'development') {
  // set up vite-dev-server in development
  http.use(vite())
} else {
  // serving the bundler output in production
  http.serve('/', path.join(__dirname, '../dist/client'))
}

http.listen(3002, () => {
  console.log('server started at http://localhost:3002')
})
```

In `package.json`

```json
{
  "scripts": {
    "dev": "farrow dev",
    "build": "tsc && vite build && farrow build"
  }
}
```

## API

```typescript
import { vite } from 'farrow-vite'

/**
 * InlineConfig is the same as vite
 * see https://vitejs.dev/guide/api-javascript.html#inlineconfig
 *
 * RouterPipeline is used for farrow-http
 */
const vite: (options?: InlineConfig | undefined) => RouterPipeline
```
