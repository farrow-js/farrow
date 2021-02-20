import path from 'path'
import { Http } from 'farrow-http'
import { cors } from 'farrow-cors'
import { service as TodoService } from './api/todo'

const http = Http()

http.route('/api/todo').use(cors()).use(TodoService)

http.serve('/', path.join(__dirname, '../dist/client'))

http.listen(3002, () => {
  console.log('server started at http://localhost:3002')
})
