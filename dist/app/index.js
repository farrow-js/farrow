"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const core_1 = require("../core");
const createApp = (options) => {
    let pipeline = core_1.createContextualPipeline({
        contexts: options === null || options === void 0 ? void 0 : options.contexts,
    });
    let add = pipeline.add;
    let run = (input) => {
        return pipeline.run(input);
    };
    return {
        add,
        run,
    };
};
exports.createApp = createApp;
