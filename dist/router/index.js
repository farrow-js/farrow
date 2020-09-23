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
const core_1 = require("../core");
const Schema = __importStar(require("../schema/type"));
const createRouterPipeline = (options) => {
    let pipeline = core_1.createPipeline({
        defaultOutput: options.defaultOutput,
        contexts: options.contexts,
    });
    let middleware = function (input, next) {
        let runPipeline = core_1.usePipeline(pipeline);
        let result = options.input.validate(input);
        if (result.isErr) {
            return next();
        }
        return runPipeline(result.value);
    };
    let add = pipeline.add;
    return {
        middleware,
        add,
    };
};
exports.createRouterPipeline = createRouterPipeline;
const Json = Schema.thunk('Json', () => {
    return Schema.union(Schema.number, Schema.string, Schema.boolean, Schema.literal(null), Schema.list(Json), Schema.record(Json));
});
let json = Json(1);
let Int = Schema.number.pipe({
    shape: 'Int',
    validate: (n) => {
        if (!Number.isInteger(n)) {
            return Schema.Err(`${n} is not integer`);
        }
        else {
            return Schema.Ok(n);
        }
    },
});
let int = Int(0.2);
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
const app = createContextualPipeline();
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
