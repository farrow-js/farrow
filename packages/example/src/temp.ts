import path from 'path'
import { Http, Response } from 'farrow-http'

const http = Http()

http.get('/greet/<name:string>?<age:int>&farrow=type-safe').use((request) => {
  console.log(request.query.farrow)
  return Response.text(`Hello ${request.params.name}, your age is ${request.query.age}`)
})

http.get('/hello').use(() => {
  return Response.status(200)
    .header('Content-Type', 'application/json')
    .cookie('sessionId', '{sessionId}')
    .html('<h1>Farrow</h1>')
})

http.serve('/static', path.join(__dirname, '../static'))

http.listen(3000, () => {
  console.log(`server started at http://localhost:3002`)
})
