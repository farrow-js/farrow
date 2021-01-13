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

http
  .match({
    url: '/note/<name:string>',
    method: ['GET', 'POST'],
  })
  .use((_req) => {
    return Response.text('')
  })

http
  .match({
    pathname: '/product',
    // if method was not given, the default value wounld be `GET`.
    query: {
      productId: Number,
    },
  })
  .use((request) => {
    // productId is a number

    console.log('productId', request.query.productId)

    return Response.json({
      productId: request.query.productId,
    })
  })

http.get('/product?<productId:number>').use((request) => {
  // productId is a number

  console.log('productId', request.query.productId)

  return Response.json({
    productId: request.query.productId,
  })
})

http.serve('/static', path.join(__dirname, '../static'))

http.listen(3000, () => {
  console.log(`server started at http://localhost:3002`)
})
