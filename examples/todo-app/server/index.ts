import path from 'path'
import { Http } from 'farrow-http'
import { vite } from 'farrow-vite'

import { service as TodoService } from './api/todo'

let http = Http()

http.route('/api/todo').use(TodoService)

if (process.env.NODE_ENV === 'development') {
  http.use(vite())
} else {
  http.serve('/', path.join(__dirname, '../dist/client'))
}

http.listen(3002, () => {
  console.log('server started at http://localhost:3002')
})
