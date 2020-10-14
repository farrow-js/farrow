"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouterPipeline = void 0;
const pipeline_1 = require("./pipeline");
const createRouterPipeline = (options) => {
    let pipeline = pipeline_1.createPipeline({
        contexts: options.contexts,
    });
    let middleware = function (input, next) {
        let runPipeline = pipeline_1.usePipeline(pipeline);
        let result = options.input.validate(input);
        if (result.isErr) {
            return next();
        }
        return runPipeline(result.value);
    };
    return {
        middleware,
        add: pipeline.add,
        run: pipeline.run,
    };
};
exports.createRouterPipeline = createRouterPipeline;
