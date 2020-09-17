"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCellValue = exports.usePipeline = exports.useCell = exports.useManager = exports.createHook = exports.createMiddleware = exports.createContextualPipeline = exports.assertContextCell = exports.assertContextManager = exports.isContextCell = exports.isContextManager = exports.createContextManager = exports.createContextCell = exports.isPipeline = exports.createPipeline = void 0;
const pipeline_1 = require("./pipeline");
Object.defineProperty(exports, "createPipeline", { enumerable: true, get: function () { return pipeline_1.createPipeline; } });
Object.defineProperty(exports, "isPipeline", { enumerable: true, get: function () { return pipeline_1.isPipeline; } });
const context_1 = require("./context");
Object.defineProperty(exports, "createContextCell", { enumerable: true, get: function () { return context_1.createContextCell; } });
Object.defineProperty(exports, "createContextManager", { enumerable: true, get: function () { return context_1.createContextManager; } });
Object.defineProperty(exports, "isContextManager", { enumerable: true, get: function () { return context_1.isContextManager; } });
Object.defineProperty(exports, "assertContextManager", { enumerable: true, get: function () { return context_1.assertContextManager; } });
Object.defineProperty(exports, "assertContextCell", { enumerable: true, get: function () { return context_1.assertContextCell; } });
Object.defineProperty(exports, "isContextCell", { enumerable: true, get: function () { return context_1.isContextCell; } });
const defaultOptions = {};
const createContextualPipeline = (options = defaultOptions) => {
    let pipeline = pipeline_1.createPipeline();
    let manager = context_1.createContextManager(options.contexts);
    let run = async (input, currentManager = manager) => {
        context_1.assertContextManager(currentManager);
        let result = pipeline.run(input);
        return currentManager.run(result);
    };
    return {
        add: pipeline.add,
        run,
    };
};
exports.createContextualPipeline = createContextualPipeline;
const createMiddleware = (middleware) => {
    return middleware;
};
exports.createMiddleware = createMiddleware;
const createHook = (f) => {
    return f;
};
exports.createHook = createHook;
exports.useManager = exports.createHook(async function* () {
    let manager = yield context_1.ContextManagerRequestSymbol;
    return manager;
});
exports.useCell = exports.createHook(async function* (ContextCell) {
    let manager = yield* exports.useManager();
    let cell = {
        get value() {
            return manager.read(ContextCell);
        },
        set value(v) {
            manager.write(ContextCell, v);
        },
    };
    return Object.seal(cell);
});
exports.usePipeline = exports.createHook(async function* (pipeline, input) {
    let manager = yield* exports.useManager();
    let result = await pipeline.run(input, manager);
    return result;
});
exports.useCellValue = exports.createHook(async function* (ContextCell) {
    let manager = yield* exports.useManager();
    return manager.read(ContextCell);
});
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
// const Json = <T>(data: T): Response => {
//   let body = JSON.stringify(data)
//   return {
//     statusCode: 200,
//     statusMessage: 'OK',
//     headers: {
//       'Content-Type': 'application/json',
//       'Content-Length': Buffer.byteLength(body),
//     },
//     body,
//   }
// }
// const Text = (content: string): Response => {
//   return {
//     statusCode: 200,
//     statusMessage: 'OK',
//     headers: {
//       'Content-Type': 'text/plain',
//       'Content-Length': Buffer.byteLength(content),
//     },
//     body: content,
//   }
// }
// const sleep = (duration: number) => {
//   return new Promise((resolve) => {
//     setTimeout(resolve, duration)
//   })
// }
// const pipeline = createContextualPipeline<Request, Response>()
// pipeline.add(async function* (request, next) {
//   if (request.query?.name) {
//     let nextRequest = {
//       ...request,
//       query: {
//         ...request.query,
//         name: `Rewrite(${request.query.name})`,
//       },
//     }
//     return yield* next(nextRequest)
//   } else {
//     return yield* next()
//   }
// })
// pipeline.add(async function* (request, next) {
//   if (request.query?.name) {
//     return Text(`Hello ${request.query?.name ?? 'World'}`)
//   } else {
//     return yield* next()
//   }
// })
// pipeline.add(async function* (request, next) {
//   let response = yield* next(request)
//   let loggerMap = yield* useCellValue(LoggerCell)
//   if (loggerMap) {
//     console.log('logger', [...(loggerMap?.entries() ?? [])])
//   }
//   return response
// })
// type LoggerMap = Map<string, string[]>
// const LoggerCell = createContextCell<LoggerMap | null>(null)
// const useLogger = createHook(async function* (name: string) {
//   let loggerCell = yield* useCell(LoggerCell)
//   if (!loggerCell.value) {
//     loggerCell.value = new Map()
//   }
//   let logger = loggerCell.value
//   let contents = logger.get(name)
//   if (!contents) {
//     contents = []
//     logger.set(name, contents)
//   }
//   let result = {
//     add: (content: string) => {
//       contents?.push(content)
//     },
//   }
//   return result
// })
// pipeline.add(async function* (request, next) {
//   let start = Date.now()
//   let logger = yield* useLogger('time')
//   let response = yield* next()
//   logger.add(`path: ${request.pathname}, take time ${(Date.now() - start).toFixed(2)}ms`)
//   return response
// })
// pipeline.add(async function* (request) {
//   await sleep(500)
//   return Json(request)
// })
// let result = pipeline
//   .run({
//     pathname: '/test',
//     method: 'POST',
//     body: {
//       a: 1,
//       b: 2,
//     },
//   })
//   .then((response) => {
//     console.log('response', response)
//   })
// let result0 = pipeline
//   .run({
//     pathname: '/hello',
//     method: 'POST',
//     query: {
//       name: 'Bill',
//     },
//   })
//   .then((response) => {
//     console.log('response', response)
//   })
