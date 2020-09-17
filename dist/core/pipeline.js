"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPipeline = exports.isPipeline = void 0;
const counter_1 = require("./counter");
const isPipeline = (input) => {
    return !!(input && input[PipelineSymbol]);
};
exports.isPipeline = isPipeline;
const PipelineSymbol = Symbol('pipeline');
const identity = (a) => a;
const createPipeline = (defaultValue = PipelineSymbol) => {
    let middlewares = [];
    let add = (middleware) => {
        middlewares.push(middleware);
    };
    let run = (input, enhancer = identity) => {
        let counter = counter_1.createCounter((index, input, next) => {
            if (index >= middlewares.length) {
                if (defaultValue !== PipelineSymbol) {
                    return defaultValue;
                }
                throw new Error(`Expect returning a value, but all middlewares just calling next()`);
            }
            let middleware = enhancer(middlewares[index]);
            let result = middleware(input, next);
            return result;
        });
        return counter.start(input);
    };
    return {
        [PipelineSymbol]: true,
        add,
        run,
    };
};
exports.createPipeline = createPipeline;
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
