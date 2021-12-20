import { Http, Response } from 'farrow-http'

const http = Http({ logger: false })

http.use(() => {
  return Response.text('Hello Farrow.')
})

http.listen(3000, () => {
  console.log('server started at http://localhost:3000')
})
