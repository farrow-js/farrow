import { Http } from 'farrow-http'
import { next } from 'farrow-next-server'

import { services } from './api'

// create http server
const http = Http()

// attach service for api
http.use(services)

// attach next.js for page
http.use(next())

// start listening
http.listen(3002, () => {
  console.log('server started at http://localhost:3002')
})
