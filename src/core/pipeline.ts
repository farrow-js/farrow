import { Next, createCounter } from './counter'

export { Next }

export type Middleware<I = unknown, O = unknown> = (input: I, next: Next<I, O>) => O

export type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[]

export const createMiddleware = <T extends Middleware>(f: T): T => {
  return f
}

export const isPipeline = (input: any): input is Pipeline => {
  return !!(input && input[PipelineSymbol])
}

const PipelineSymbol = Symbol('pipeline')

type PipelineSymbol = typeof PipelineSymbol

export type Pipeline<I = unknown, O = unknown> = {
  [PipelineSymbol]: true
  add: (input: Middleware<I, O>) => void
  run: (input: I) => O
}

export const createPipeline = <I, O>(
  defaultValue: O | PipelineSymbol = PipelineSymbol
): Pipeline<I, O> => {
  type Add = Pipeline<I, O>['add']
  type Run = Pipeline<I, O>['run']

  let middlewares: Middlewares<I, O> = []

  let counter = createCounter<I, O>((index, input, next) => {
    if (index >= middlewares.length) {
      if (defaultValue !== PipelineSymbol) {
        return defaultValue
      }
      throw new Error(`Expect returning a value, but all middlewares just calling next()`)
    }

    let middleware = middlewares[index]
    let result = middleware(input, next)

    return result
  })

  let add: Add = (middleware) => {
    middlewares.push(middleware)
  }

  let run: Run = (input) => {
    return counter.start(input)
  }

  return {
    [PipelineSymbol]: true,
    add,
    run,
  }
}

// type Request = {
//   pathname: string
//   method?: string
//   body?: Record<string, any>
//   query?: Record<string, any>
//   cookies?: Record<string, any>
//   headers?: Record<string, any>
// }

// type Response = {
//   statusCode: number
//   statusMessage: string
//   headers: {
//     [key: string]: string | number
//   }
//   body: string | object | null
// }

// const sleep = (duration: number) => {
//   return new Promise(resolve => {
//     setTimeout(resolve, duration)
//   })
// }

// const defaultResponse: Promise<Response> = Promise.resolve({
//   statusCode: 404,
//   statusMessage: 'Not Found',
//   headers: {},
//   body: null
// })

// const pipeline = createPipeline<Request, Promise<Response>>()

// pipeline.add(async (request, next) => {
//   if (request.query?.name) {
//     return Text(`Hello ${request.query?.name ?? 'World'}`)
//   } else {
//     return next(request)
//   }
// })

// pipeline.add(async (request, next) => {
//   if (request.pathname === '/users') {
//     let body = request.body as { list: number[] }

//     let requests = body.list.map(userId => {
//       return {
//         method: 'GET',
//         pathname: `/user/${userId}`
//       }
//     })

//     let responses = await Promise.all(requests.map(next))

//     let users = responses
//       .filter(response => response.statusCode === 200)
//       .map(response => response.body)

//     return Json(users)
//   } else {
//     return next(request)
//   }
// })

// pipeline.add(async function(request, next) {
//   let start = Date.now()
//   let response = await next(request)

//   console.log({
//     request,
//     response,
//     time: (Date.now() - start).toFixed(2) + 'ms'
//   })

//   return response
// })

// const Json = <T>(data: T): Response => {
//   let body = JSON.stringify(data)
//   return {
//     statusCode: 200,
//     statusMessage: 'OK',
//     headers: {
//       'Content-Type': 'application/json',
//       'Content-Length': Buffer.byteLength(body)
//     },
//     body
//   }
// }

// const Text = (content: string): Response => {
//   return {
//     statusCode: 200,
//     statusMessage: 'OK',
//     headers: {
//       'Content-Type': 'text/plain',
//       'Content-Length': Buffer.byteLength(content)
//     },
//     body: content
//   }
// }

// pipeline.add(async function(request) {
//   await sleep(500)
//   return Json(request)
// })

// let result = pipeline
//   .run({
//     pathname: '/test',
//     method: 'POST',
//     body: {
//       a: 1,
//       b: 2
//     }
//   })
//   .then(response => {
//     console.log('response', response)
//   })

// let result0 = pipeline
//   .run({
//     pathname: '/hello',
//     method: 'POST',
//     query: {
//       name: 'Bill'
//     }
//   })
//   .then(response => {
//     console.log('response', response)
//   })
