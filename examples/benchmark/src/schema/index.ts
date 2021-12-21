import { Http, Response } from 'farrow-http'
import { Unknown, Struct } from 'farrow-schema'
import { Api } from 'farrow-api'
import { ApiService } from 'farrow-api-server'

const http = Http()

const Greeting = Api({
  input: Unknown,
  output: Struct({
    message: String
  })
}, () => {
  return {
    message: 'Hello Farrow.'
  }
})

const GreetingService = ApiService({
  entries: {
    Greeting
  }
})

http.use(GreetingService)

http.listen(3001, () => {
  console.log('server started at http://localhost:3001')
})
