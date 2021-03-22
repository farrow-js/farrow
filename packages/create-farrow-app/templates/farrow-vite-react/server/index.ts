import path from 'path'
import { Http } from 'farrow-http'
import { vite } from 'farrow-vite'

import { services } from './api'

// create http server
const http = Http()

// attach service for api
http.use(services)

// attach vite or assets for page
if (process.env.NODE_ENV === 'development') {
  // enable vite-dev-server when development
  http.use(vite())
} else {
  // enable vite-bundle-output when production
  http.serve('/', path.join(__dirname, '../dist/client'))
}

// start listening
http.listen(3003, () => {
  console.log('server started at http://localhost:3003')
})
