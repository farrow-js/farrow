import { Http } from 'farrow-http'

import { services } from './api'

const http = Http()

http.use(services)

http.listen(3002, () => {
  console.log('server started at http://localhost:3002')
})
