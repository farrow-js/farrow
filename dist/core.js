"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMatchPath = exports.useMatchHeaders = exports.useMatchBody = exports.useMatchQuery = exports.combine = exports.Ok = exports.Err = exports.useRoute = exports.useUrl = exports.useHeaders = exports.useRes = exports.useReq = exports.createExpressMiddleware = exports.useMiddleware = exports.useRef = exports.useContext = exports.useResponse = exports.useRequest = void 0;
const debug_1 = __importDefault(require("debug"));
const path_to_regexp_1 = require("path-to-regexp");
const url_1 = require("url");
const hooks_1 = require("./hooks");
const context_1 = require("./context");
const ref_1 = require("./ref");
const middleware_1 = require("./middleware");
const debugHttp = debug_1.default('http');
let { run, hooks } = hooks_1.createHooks({
    useRequest() {
        throw new Error(`useRequest can't not be called after initilizing`);
    },
    useResponse() {
        throw new Error(`useResponse can't not be called after initilizing`);
    },
    useContext() {
        throw new Error(`useContext can't not be called after initilizing`);
    },
    useRef() {
        throw new Error(`useRef can't not be called after initilizing`);
    },
    useMiddleware() {
        throw new Error(`useMiddleware can't not be called after initilizing`);
    }
});
exports.useRequest = hooks.useRequest, exports.useResponse = hooks.useResponse, exports.useContext = hooks.useContext, exports.useRef = hooks.useRef, exports.useMiddleware = hooks.useMiddleware;
exports.createExpressMiddleware = (initializer, options = {}) => {
    if (options.context && !options.context[context_1.FARROW_CONTEXT]) {
        throw new Error(`options.context should be a Farrow Context, but received ${options.context}`);
    }
    let requestHandler = async (req, res, next) => {
        let useRequest = () => {
            return req;
        };
        let useResponse = () => {
            return res;
        };
        let middlewares = [];
        let useMiddleware = (...args) => {
            for (let i = 0; i < args.length; i++) {
                let middleware = args[i];
                // tslint:disable-next-line: strict-type-predicates
                if (typeof middleware !== 'function') {
                    throw new Error(`middleware should be a function, but received ${middleware}`);
                }
                middlewares.push(middleware);
            }
        };
        let useContext = (Context) => {
            if (!Context) {
                throw new Error(`The first argument should be a Context, but received ${Context}`);
            }
            if (options.context) {
                let target = context_1.getContextValue(options.context, Context.id);
                if (target) {
                    return target.value;
                }
            }
            return Context.initialValue;
        };
        let refs = new Map();
        let useRef = (Ref) => {
            if (!Ref || !Ref[ref_1.FARROW_REF]) {
                throw new Error(`The first argument should be a Ref, but received ${Ref}`);
            }
            let currentSymbol = Ref[ref_1.FARROW_REF];
            if (refs.has(currentSymbol)) {
                return refs.get(currentSymbol);
            }
            let ref = {
                current: null
            };
            refs.set(currentSymbol, ref);
            return ref;
        };
        let result = run(initializer, {
            useRequest,
            useResponse,
            useMiddleware,
            useContext,
            useRef
        });
        // tslint:disable-next-line: strict-type-predicates
        if (typeof result !== 'undefined') {
            throw new Error(`Expected initializer function return undefined, but received ${result}`);
        }
        try {
            await middleware_1.runMiddlewares(middlewares, async () => next());
        }
        catch (error) {
            next(error);
        }
    };
    return requestHandler;
};
exports.useReq = exports.useRequest;
exports.useRes = exports.useResponse;
exports.useHeaders = () => {
    let req = exports.useReq();
    return req.headers;
};
const UrlRef = ref_1.createRef();
exports.useUrl = () => {
    let ref = exports.useRef(UrlRef);
    if (ref.current) {
        return ref.current;
    }
    let req = exports.useReq();
    let url = new url_1.URL(`http://${req.hostname + req.url || ''}`);
    ref.current = url;
    return url;
};
exports.useRoute = (pattern, handler) => {
    exports.useMiddleware(async (next) => {
        if (pattern.kind === 'Err') {
            return next();
        }
        let value = pattern.value;
        return handler(value, next);
    });
};
exports.Err = (value) => {
    return {
        kind: 'Err',
        value
    };
};
exports.Ok = (value) => {
    return {
        kind: 'Ok',
        value
    };
};
function combine(results, f) {
    let values = [];
    for (let i = 0; i < results.length; i++) {
        let result = results[i];
        if (result.kind === 'Ok') {
            values.push(result.value);
        }
        else {
            return result;
        }
    }
    return exports.Ok(f(...values));
}
exports.combine = combine;
exports.useMatchQuery = (f) => {
    let req = exports.useReq();
    return f(req.query);
};
exports.useMatchBody = (f) => {
    let req = exports.useReq();
    let body = req.body;
    if (!body) {
        return exports.Err(`req.body is not existed`);
    }
    return f(body);
};
exports.useMatchHeaders = (f) => {
    let headers = exports.useHeaders();
    return f(headers);
};
exports.useMatchPath = (path, f) => {
    let matcher = path_to_regexp_1.match(path);
    let url = exports.useUrl();
    let result = matcher(url.pathname);
    if (!result) {
        return exports.Err(`${url.pathname} is not matched by ${path}`);
    }
    return f(result.params);
};
