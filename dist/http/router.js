"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouterPipeline = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const pipeline_1 = require("../core/pipeline");
const Schema = __importStar(require("../core/schema"));
const createRequestSchema = (options) => {
    let fileds = {};
    for (let key in options) {
        let value = options[key];
        if (Schema.isType(value)) {
            fileds[key] = value;
            // tslint:disable-next-line: strict-type-predicates
        }
        else if (typeof value === 'string') {
            fileds[key] = Schema.string;
        }
        else {
            throw new Error(`Unknown option, ${key}: ${value}`);
        }
    }
    return Schema.object(fileds);
};
const createRouterPipeline = (options) => {
    let pipeline = pipeline_1.createPipeline();
    let schema = createRequestSchema(options);
    let match = path_to_regexp_1.match(options.pathname);
    let middleware = function (input, next) {
        let runPipeline = pipeline_1.usePipeline(pipeline);
        if (typeof options.method === 'string') {
            if (options.method !== input.method) {
                return next();
            }
        }
        let matches = match(input.pathname);
        if (!matches) {
            return next();
        }
        let params = matches.params;
        let result = schema.validate({
            ...input,
            params,
        });
        if (result.isErr) {
            throw new Error(result.value.message);
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
