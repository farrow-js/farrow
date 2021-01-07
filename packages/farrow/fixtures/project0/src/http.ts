import { Http, Response } from 'farrow-http'

export const http = Http({
  logger: false,
})

http.get('/user/<id:int>').use((request) => {
  return Response.json({
    user: {
      id: request.params.id,
    },
  })
})
