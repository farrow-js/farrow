"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePipeline = exports.createPipeline = exports.isPipeline = exports.useContext = exports.useCell = exports.useCellValue = exports.createContext = exports.createCell = void 0;
const context_1 = require("./context");
Object.defineProperty(exports, "createCell", { enumerable: true, get: function () { return context_1.createCell; } });
Object.defineProperty(exports, "createContext", { enumerable: true, get: function () { return context_1.createContext; } });
Object.defineProperty(exports, "useCell", { enumerable: true, get: function () { return context_1.useCell; } });
Object.defineProperty(exports, "useCellValue", { enumerable: true, get: function () { return context_1.useCellValue; } });
Object.defineProperty(exports, "useContext", { enumerable: true, get: function () { return context_1.useContext; } });
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
    let currentContext = context_1.createContext(settings.contexts);
    let currentHooks = context_1.fromContext(currentContext);
    let currentCounter = createCurrentCounter(currentHooks);
    let run = (input, context = currentContext) => {
        context_1.assertContext(context);
        let hooks = context === currentContext ? currentHooks : context_1.fromContext(context);
        let counter = context === currentContext ? currentCounter : createCurrentCounter(hooks);
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
    let context = context_1.useContext();
    let runPipeline = (input) => {
        return pipeline.run(input, context);
    };
    return runPipeline;
};
exports.usePipeline = usePipeline;
