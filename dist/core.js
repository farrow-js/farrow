"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMatchPath = exports.useMatchHeaders = exports.useMatchBody = exports.useMatchQuery = exports.combine = exports.Ok = exports.Err = exports.useRoute = exports.useUrl = exports.useHeaders = exports.useRes = exports.useReq = exports.createExpressMiddleware = exports.useMiddleware = exports.useRef = exports.useContext = exports.useResponse = exports.useRequest = void 0;
var debug_1 = __importDefault(require("debug"));
var path_to_regexp_1 = require("path-to-regexp");
var url_1 = require("url");
var hooks_1 = require("./hooks");
var context_1 = require("./context");
var ref_1 = require("./ref");
var middleware_1 = require("./middleware");
var debugHttp = debug_1.default('http');
var _a = hooks_1.createHooks({
    useRequest: function () {
        throw new Error("useRequest can't not be called after initilizing");
    },
    useResponse: function () {
        throw new Error("useResponse can't not be called after initilizing");
    },
    useContext: function () {
        throw new Error("useContext can't not be called after initilizing");
    },
    useRef: function () {
        throw new Error("useRef can't not be called after initilizing");
    },
    useMiddleware: function () {
        throw new Error("useMiddleware can't not be called after initilizing");
    }
}), run = _a.run, hooks = _a.hooks;
exports.useRequest = hooks.useRequest, exports.useResponse = hooks.useResponse, exports.useContext = hooks.useContext, exports.useRef = hooks.useRef, exports.useMiddleware = hooks.useMiddleware;
exports.createExpressMiddleware = function (initializer, options) {
    if (options === void 0) { options = {}; }
    if (options.context && !options.context[context_1.FARROW_CONTEXT]) {
        throw new Error("options.context should be a Farrow Context, but received " + options.context);
    }
    var requestHandler = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var useRequest, useResponse, middlewares, useMiddleware, useContext, refs, useRef, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    useRequest = function () {
                        return req;
                    };
                    useResponse = function () {
                        return res;
                    };
                    middlewares = [];
                    useMiddleware = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        for (var i = 0; i < args.length; i++) {
                            var middleware = args[i];
                            // tslint:disable-next-line: strict-type-predicates
                            if (typeof middleware !== 'function') {
                                throw new Error("middleware should be a function, but received " + middleware);
                            }
                            middlewares.push(middleware);
                        }
                    };
                    useContext = function (Context) {
                        if (!Context) {
                            throw new Error("The first argument should be a Context, but received " + Context);
                        }
                        if (options.context) {
                            var target = context_1.getContextValue(options.context, Context.id);
                            if (target) {
                                return target.value;
                            }
                        }
                        return Context.initialValue;
                    };
                    refs = new Map();
                    useRef = function (Ref) {
                        if (!Ref || !Ref[ref_1.FARROW_REF]) {
                            throw new Error("The first argument should be a Ref, but received " + Ref);
                        }
                        var currentSymbol = Ref[ref_1.FARROW_REF];
                        if (refs.has(currentSymbol)) {
                            return refs.get(currentSymbol);
                        }
                        var ref = {
                            current: null
                        };
                        refs.set(currentSymbol, ref);
                        return ref;
                    };
                    result = run(initializer, {
                        useRequest: useRequest,
                        useResponse: useResponse,
                        useMiddleware: useMiddleware,
                        useContext: useContext,
                        useRef: useRef
                    });
                    // tslint:disable-next-line: strict-type-predicates
                    if (typeof result !== 'undefined') {
                        throw new Error("Expected initializer function return undefined, but received " + result);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, middleware_1.runMiddlewares(middlewares, function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, next()];
                        }); }); })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    next(error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return requestHandler;
};
exports.useReq = exports.useRequest;
exports.useRes = exports.useResponse;
exports.useHeaders = function () {
    var req = exports.useReq();
    return req.headers;
};
var UrlRef = ref_1.createRef();
exports.useUrl = function () {
    var ref = exports.useRef(UrlRef);
    if (ref.current) {
        return ref.current;
    }
    var req = exports.useReq();
    var url = new url_1.URL("http://" + (req.hostname + req.url || ''));
    ref.current = url;
    return url;
};
exports.useRoute = function (pattern, handler) {
    exports.useMiddleware(function (next) { return __awaiter(void 0, void 0, void 0, function () {
        var value;
        return __generator(this, function (_a) {
            if (pattern.kind === 'Err') {
                return [2 /*return*/, next()];
            }
            value = pattern.value;
            return [2 /*return*/, handler(value, next)];
        });
    }); });
};
exports.Err = function (value) {
    return {
        kind: 'Err',
        value: value
    };
};
exports.Ok = function (value) {
    return {
        kind: 'Ok',
        value: value
    };
};
function combine(results, f) {
    var values = [];
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        if (result.kind === 'Ok') {
            values.push(result.value);
        }
        else {
            return result;
        }
    }
    return exports.Ok(f.apply(void 0, __spread(values)));
}
exports.combine = combine;
exports.useMatchQuery = function (f) {
    var req = exports.useReq();
    return f(req.query);
};
exports.useMatchBody = function (f) {
    var req = exports.useReq();
    var body = req.body;
    if (!body) {
        return exports.Err("req.body is not existed");
    }
    return f(body);
};
exports.useMatchHeaders = function (f) {
    var headers = exports.useHeaders();
    return f(headers);
};
exports.useMatchPath = function (path, f) {
    var matcher = path_to_regexp_1.match(path);
    var url = exports.useUrl();
    var result = matcher(url.pathname);
    if (!result) {
        return exports.Err(url.pathname + " is not matched by " + path);
    }
    return f(result.params);
};
