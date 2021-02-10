import path from 'path'
import { Http, Response } from 'farrow-http'
import { router as api } from './api'
import { router as pages } from './pages'
import { Action2Api } from './middleware/Action2Page'
import { router as flight } from './flight'
import { service as TodoService } from './services/todo'

const http = Http({
  basenames: ['/base'],
})

http.get('/greet/<name:string>?<age:int>&farrow=type-safe').use((request) => {
  console.log(request.query.farrow)
  return Response.text(`Hello ${request.params.name}, your age is ${request.query.age}`)
})

http.use(pages)

// rewrite /action/... to /api/...
// and redirect to home page
http.use(Action2Api('/'))

http.serve('/static', path.join(__dirname, '../static'))

http.route('/api').use(api)
http.route('/flight').use(flight)

http.route('/service/todo').use(TodoService)

http.listen(3002, () => {
  console.log(`server started at http://localhost:3002`)
})

console.log('NODE_ENV', process.env.NODE_ENV)
