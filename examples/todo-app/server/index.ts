import path from 'path'
import { Http } from 'farrow-http'
import { vite } from 'farrow-vite'

import { services } from './api'

let http = Http()

http.use(services)

if (process.env.NODE_ENV === 'development') {
  http.use(vite())
} else {
  http.serve('/', path.join(__dirname, '../dist/client'))
}

http.listen(3002, () => {
  console.log('server started at http://localhost:3002')
})
