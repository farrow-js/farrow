"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePipeline = exports.createPipeline = exports.isPipeline = exports.useManager = exports.useCell = exports.useCellValue = exports.createContextManager = exports.createContextCell = void 0;
const context_1 = require("./context");
Object.defineProperty(exports, "createContextCell", { enumerable: true, get: function () { return context_1.createContextCell; } });
Object.defineProperty(exports, "createContextManager", { enumerable: true, get: function () { return context_1.createContextManager; } });
Object.defineProperty(exports, "useCell", { enumerable: true, get: function () { return context_1.useCell; } });
Object.defineProperty(exports, "useCellValue", { enumerable: true, get: function () { return context_1.useCellValue; } });
Object.defineProperty(exports, "useManager", { enumerable: true, get: function () { return context_1.useManager; } });
const counter_1 = require("./counter");
const isPipeline = (input) => {
    return !!(input && input[PipelineSymbol]);
};
exports.isPipeline = isPipeline;
const PipelineSymbol = Symbol('pipeline');
const createPipeline = (options) => {
    let settings = {
        ...options,
    };
    let middlewares = [];
    let add = (middleware) => {
        middlewares.push(middleware);
    };
    let createCurrentCounter = (hooks) => {
        return counter_1.createCounter((index, input, next) => {
            if (index >= middlewares.length) {
                if (settings.defaultOutput !== undefined) {
                    return settings.defaultOutput;
                }
                throw new Error(`Expect returning a value, but all middlewares just calling next()`);
            }
            let middleware = middlewares[index];
            let result = context_1.runContextHooks(() => middleware(input, next), hooks);
            return result;
        });
    };
    let currentManager = context_1.createContextManager(settings.contexts);
    let currentHooks = context_1.fromManager(currentManager);
    let currentCounter = createCurrentCounter(currentHooks);
    let run = (input, manager = currentManager) => {
        context_1.assertContextManager(manager);
        let hooks = manager === currentManager ? currentHooks : context_1.fromManager(manager);
        let counter = manager === currentManager ? currentCounter : createCurrentCounter(hooks);
        let result = counter.start(input);
        return result;
    };
    return {
        [PipelineSymbol]: true,
        add,
        run,
    };
};
exports.createPipeline = createPipeline;
const usePipeline = (pipeline) => {
    let manager = context_1.useManager();
    let runPipeline = (input) => {
        return pipeline.run(input, manager);
    };
    return runPipeline;
};
exports.usePipeline = usePipeline;
const Json = (data) => {
    let body = JSON.stringify(data);
    return {
        statusCode: 200,
        statusMessage: 'OK',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
        },
        body,
    };
};
const Text = (content) => {
    return {
        statusCode: 200,
        statusMessage: 'OK',
        headers: {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(content),
        },
        body: content,
    };
};
const sleep = (duration) => {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
};
const pipeline = exports.createPipeline();
pipeline.add(async (request, next) => {
    var _a;
    if ((_a = request.query) === null || _a === void 0 ? void 0 : _a.name) {
        let query = {
            ...request.query,
            name: `Rewrite(${request.query.name})`,
        };
        return next({
            ...request,
            query,
        });
    }
    else {
        return next();
    }
});
pipeline.add(async (request, next) => {
    var _a, _b, _c;
    if ((_a = request.query) === null || _a === void 0 ? void 0 : _a.name) {
        return Text(`Hello ${(_c = (_b = request.query) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : 'World'}`);
    }
    else {
        return next();
    }
});
pipeline.add(async (request, next) => {
    var _a;
    let loggerMap = context_1.useCell(LoggerCell);
    let response = await next(request);
    if (loggerMap.value) {
        console.log('logger', [...((_a = loggerMap.value.entries()) !== null && _a !== void 0 ? _a : [])]);
    }
    return response;
});
const LoggerCell = context_1.createContextCell(null);
const useLogger = (name) => {
    let loggerCell = context_1.useCell(LoggerCell);
    if (!loggerCell.value) {
        loggerCell.value = new Map();
    }
    let logger = loggerCell.value;
    let contents = logger.get(name);
    if (!contents) {
        contents = [];
        logger.set(name, contents);
    }
    let result = {
        add: (content) => {
            contents === null || contents === void 0 ? void 0 : contents.push(content);
        },
        get: () => {
            return contents;
        },
    };
    return result;
};
pipeline.add(async (request, next) => {
    let logger = useLogger('time');
    let start = Date.now();
    await sleep(100);
    let response = await next();
    logger.add(`path: ${request.pathname}, take time ${(Date.now() - start).toFixed(2)}ms`);
    return response;
});
pipeline.add(async function (request) {
    useLogger('time');
    await sleep(200);
    return Json(request);
});
let result = pipeline
    .run({
    pathname: '/test',
    method: 'POST',
    body: {
        a: 1,
        b: 2,
    },
})
    .then((response) => {
    console.log('response', response);
});
let result0 = pipeline
    .run({
    pathname: '/hello',
    method: 'POST',
    query: {
        name: 'Bill',
    },
})
    .then((response) => {
    console.log('response', response);
});
