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
const core_1 = require("../core");
const Schema = __importStar(require("../schema"));
const createSchema = (options) => {
    let { pathname, ...rest } = options;
    let schema = {};
    for (let key in rest) {
        let value = rest[key];
        schema[key] = value;
    }
    return schema;
};
const createRouterPipeline = (options) => {
    let schema = {
        ...createSchema(options),
        pathname: Schema.String,
    };
    let match = path_to_regexp_1.match(options.pathname);
    let pipeline = core_1.createContextualPipeline();
    let middleware = core_1.createMiddleware(async function* (requestInfo, next) {
        let { pathname, ...input } = requestInfo;
        let matches = match(pathname);
        if (!matches) {
            return yield* next();
        }
        let params = matches.params;
        let result = Schema.verify(schema, { ...input, pathname, params });
        if (result.kind === 'Err') {
            if (options.onValidationError) {
                options.onValidationError(result);
            }
            throw new Error(result.message);
        }
        let response = yield* core_1.usePipeline(pipeline, result.value);
        return response;
    });
    let add = pipeline.add;
    return {
        middleware,
        add,
    };
};
exports.createRouterPipeline = createRouterPipeline;
const Json = (data) => {
    let body = JSON.stringify(data);
    return {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
        },
        body,
    };
};
const Text = (content) => {
    return {
        status: 200,
        statusText: 'OK',
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
const router = exports.createRouterPipeline({
    method: 'Get',
    pathname: '/user/:userId',
    params: {
        userId: Schema.Number,
    },
});
router.add(async function* (data, next) {
    let start = Date.now();
    let response = yield* next();
    let end = Date.now();
    console.log('router', {
        time: `${(end - start).toFixed(2)}ms`,
        data,
        response,
    });
    return response;
});
router.add(async function* (data) {
    await sleep(200);
    return Json(data);
});
const app = core_1.createContextualPipeline();
app.add(router.middleware);
// tslint:disable-next-line: no-floating-promises
app
    .run({
    method: 'Get',
    pathname: '/user/123',
})
    .then((response) => {
    console.log('response', response);
});
