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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleResponse = exports.createHttpPipeline = exports.useRes = exports.useReq = exports.useResponse = exports.useRequest = exports.useBasename = exports.useRoutename = exports.Response = void 0;
const http_1 = require("http");
const fs_1 = __importDefault(require("fs"));
const path = __importStar(require("path"));
const co_body_1 = __importDefault(require("co-body"));
const cookie_1 = require("cookie");
const qs_1 = require("qs");
const type_is_1 = __importDefault(require("type-is"));
const cookies_1 = __importDefault(require("cookies"));
const statuses_1 = __importDefault(require("statuses"));
const accepts_1 = __importDefault(require("accepts"));
const encodeurl_1 = __importDefault(require("encodeurl"));
const escape_html_1 = __importDefault(require("escape-html"));
const vary_1 = __importDefault(require("vary"));
const on_finished_1 = __importDefault(require("on-finished"));
const destroy_1 = __importDefault(require("destroy"));
const mime_types_1 = __importDefault(require("mime-types"));
const pipeline_1 = require("../core/pipeline");
const response_1 = require("./response");
Object.defineProperty(exports, "Response", { enumerable: true, get: function () { return response_1.Response; } });
const basename_1 = require("./basename");
Object.defineProperty(exports, "useBasename", { enumerable: true, get: function () { return basename_1.useBasename; } });
const routename_1 = require("./routename");
Object.defineProperty(exports, "useRoutename", { enumerable: true, get: function () { return routename_1.useRoutename; } });
const dirname_1 = require("./dirname");
const RequestCell = pipeline_1.createCell(null);
const useRequest = () => {
    let request = pipeline_1.useCell(RequestCell);
    if (request.value === null) {
        throw new Error(`Expected Request, but found null`);
    }
    return request.value;
};
exports.useRequest = useRequest;
const ResponseCell = pipeline_1.createCell(null);
const useResponse = () => {
    let response = pipeline_1.useCell(ResponseCell);
    if (response.value === null) {
        throw new Error(`Expected Response, but found null`);
    }
    return response.value;
};
exports.useResponse = useResponse;
exports.useReq = exports.useRequest;
exports.useRes = exports.useResponse;
const createHttpPipeline = (options) => {
    let pipeline = pipeline_1.createPipeline();
    let handleRequest = async (req, res) => {
        var _a, _b;
        if (typeof req.url !== 'string') {
            throw new Error(`req.url is not existed`);
        }
        let url = req.url;
        let [pathname = '/', search = ''] = url.split('?');
        let method = (_a = req.method) !== null && _a !== void 0 ? _a : 'GET';
        let query = qs_1.parse(search, options.query);
        let body = await getBody(req, options.body);
        let headers = req.headers;
        let cookies = cookie_1.parse((_b = req.headers['cookie']) !== null && _b !== void 0 ? _b : '', options.cookie);
        let requestInfo = {
            pathname,
            method,
            query,
            body,
            headers,
            cookies,
        };
        let context = pipeline_1.createContext({
            ...options.contexts,
            request: RequestCell.create(req),
            response: ResponseCell.create(res),
            basename: basename_1.BasenameCell.create(''),
            routename: routename_1.RoutenameCell.create(''),
        });
        let responser = await pipeline.run(requestInfo, {
            context,
            onLast: () => response_1.Response.status(404).text('404 Not Found'),
        });
        return exports.handleResponse({
            req,
            res,
            requestInfo,
            responseInfo: responser.info,
            context,
        });
    };
    let handle = async (req, res) => {
        try {
            return await handleRequest(req, res);
        }
        catch (error) {
            let message = process.env.NODE_ENV !== 'production' ? (error === null || error === void 0 ? void 0 : error.stack) || (error === null || error === void 0 ? void 0 : error.message) : error === null || error === void 0 ? void 0 : error.message;
            if (!res.headersSent) {
                res.statusCode = 500;
                res.statusMessage = message;
                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Content-Length', Buffer.byteLength(res.statusMessage));
            }
            if (!res.writableEnded) {
                res.end(message);
            }
        }
    };
    let add = pipeline.add;
    let run = pipeline.run;
    let listen = (port, callback) => {
        let server = http_1.createServer(handle);
        server.listen(port, callback);
        return server;
    };
    let route = (name, middleware) => {
        add(routename_1.route(name, middleware));
    };
    return {
        add,
        route,
        run,
        handle,
        listen,
    };
};
exports.createHttpPipeline = createHttpPipeline;
const jsonTypes = ['json', 'application/*+json', 'application/csp-report'];
const formTypes = ['urlencoded'];
const textTypes = ['text'];
const getBody = async (req, options) => {
    let type = type_is_1.default(req, jsonTypes) || type_is_1.default(req, formTypes) || type_is_1.default(req, textTypes);
    if (type) {
        let body = await co_body_1.default(req, options);
        return body;
    }
    return null;
};
const handleResponse = async (params) => {
    let { req, res, requestInfo, responseInfo, context } = params;
    let basename = context.read(basename_1.BasenameCell);
    let dirname = context.read(dirname_1.DirnameCell);
    let routename = context.read(routename_1.RoutenameCell);
    let accept = accepts_1.default(req);
    // handle response status
    let handleStatus = (status = { code: 200 }) => {
        var _a;
        let { code, message } = status;
        res.statusCode = code;
        res.statusMessage = message || ((_a = statuses_1.default.message[code]) !== null && _a !== void 0 ? _a : '');
    };
    // handle response headers
    let handleHeaders = (headers) => {
        Object.entries(headers).forEach(([name, value]) => {
            res.setHeader(name, value);
        });
    };
    // handle response cookies
    let handleCookies = (cookies) => {
        let cookiesInstance = new cookies_1.default(req, res);
        Object.entries(cookies).forEach(([name, cookie]) => {
            if (cookie.value !== null) {
                cookiesInstance.set(name, cookie.value + '', cookie.options);
            }
            else {
                cookiesInstance.set(name, cookie.options);
            }
        });
    };
    let handleEmpty = () => {
        var _a, _b;
        let code = (_b = (_a = responseInfo.status) === null || _a === void 0 ? void 0 : _a.code) !== null && _b !== void 0 ? _b : 204;
        code = statuses_1.default.empty[code] ? code : 204;
        let body = code + '';
        handleStatus({ code });
        res.removeHeader('Transfer-Encoding');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Length', Buffer.byteLength(body));
        res.end(body);
    };
    let handleJson = (json) => {
        let content = JSON.stringify(json);
        let length = Buffer.byteLength(content);
        if (res.getHeader('Content-Type') === undefined) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
        res.setHeader('Content-Length', length);
        res.end(content);
    };
    let handleText = (text) => {
        let length = Buffer.byteLength(text);
        if (res.getHeader('Content-Type') === undefined) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
        res.setHeader('Content-Length', length);
        res.end(text);
    };
    let handleHtml = (html) => {
        let length = Buffer.byteLength(html);
        if (res.getHeader('Content-Type') === undefined) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
        res.setHeader('Content-Length', length);
        res.end(html);
    };
    let handleRedirect = (body) => {
        var _a, _b;
        let url = body.value;
        let { useBasename, useRoutename } = body;
        if (url === 'back') {
            let referrer = req.headers['referer'] + '' || '/';
            url = referrer;
        }
        // handle routename and basename
        if (!url.startsWith('//') && url.startsWith('/')) {
            if (useRoutename) {
                url = routename + url;
            }
            if (useBasename) {
                url = basename + url;
            }
        }
        let code = (_b = (_a = responseInfo.status) === null || _a === void 0 ? void 0 : _a.code) !== null && _b !== void 0 ? _b : 302;
        handleStatus({
            code: statuses_1.default.redirect[code] ? code : 302,
        });
        handleHeaders({
            Location: encodeurl_1.default(url),
        });
        if (accept.types('html')) {
            handleHtml(`Redirecting to ${escape_html_1.default(url)}`);
        }
        else {
            handleText(`Redirecting to ${url}`);
        }
    };
    let handleBuffer = (buffer) => {
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    };
    let handleFile = (name) => {
        let filename = path.join(dirname, name);
        let stream = fs_1.default.createReadStream(filename);
        let ext = path.extname(name);
        let contentType = mime_types_1.default.contentType(ext);
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }
        return handleStream(res, stream);
    };
    let { body } = responseInfo;
    handleStatus(responseInfo.status);
    if (responseInfo.cookies) {
        handleCookies(responseInfo.cookies);
    }
    if (responseInfo.headers) {
        handleHeaders(responseInfo.headers);
    }
    if (responseInfo.vary) {
        vary_1.default(res, responseInfo.vary);
    }
    if (!body || body.type === 'empty') {
        return handleEmpty();
    }
    if (body.type === 'json') {
        return handleJson(body.value);
    }
    if (body.type === 'text') {
        return handleText(body.value);
    }
    if (body.type === 'html') {
        return handleHtml(body.value);
    }
    if (body.type === 'redirect') {
        return handleRedirect(body);
    }
    if (body.type === 'stream') {
        return handleStream(res, body.value);
    }
    if (body.type === 'buffer') {
        return handleBuffer(body.value);
    }
    if (body.type === 'file') {
        return handleFile(body.value);
    }
    if (body.type === 'custom') {
        let handler = body.handler;
        let handleResponse = () => {
            return handler({
                req: req,
                res,
                requestInfo,
                responseInfo: omitBody(responseInfo),
                basename,
            });
        };
        return pipeline_1.runWithContext(handleResponse, context);
    }
    if (body.type === 'raw') {
        res.end(body.value);
        return;
    }
    throw new Error(`Unsupported response body: ${JSON.stringify(body, null, 2)}`);
};
exports.handleResponse = handleResponse;
const omitBody = (obj) => {
    let { body, ...rest } = obj;
    return rest;
};
const handleStream = (res, stream) => {
    return new Promise((resolve, reject) => {
        stream.once('error', reject);
        stream.pipe(res);
        on_finished_1.default(res, (error) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(true);
            }
            destroy_1.default(stream);
        });
    });
};
