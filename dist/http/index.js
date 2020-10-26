"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleResponse = exports.createHttpPipeline = exports.useQuery = exports.useCookies = exports.useHeaders = exports.useRes = exports.useReq = exports.useResponse = exports.useRequest = exports.usePrefix = exports.useBasenames = exports.Response = exports.createRouterPipeline = void 0;
const http_1 = require("http");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
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
const basenames_1 = require("./basenames");
Object.defineProperty(exports, "useBasenames", { enumerable: true, get: function () { return basenames_1.useBasenames; } });
Object.defineProperty(exports, "usePrefix", { enumerable: true, get: function () { return basenames_1.usePrefix; } });
const router_1 = require("./router");
Object.defineProperty(exports, "createRouterPipeline", { enumerable: true, get: function () { return router_1.createRouterPipeline; } });
const RequestCell = pipeline_1.createCell(null);
const useRequest = () => {
    let request = pipeline_1.useCellValue(RequestCell);
    return request;
};
exports.useRequest = useRequest;
const ResponseCell = pipeline_1.createCell(null);
const useResponse = () => {
    let response = pipeline_1.useCellValue(ResponseCell);
    return response;
};
exports.useResponse = useResponse;
exports.useReq = exports.useRequest;
exports.useRes = exports.useResponse;
const RequestHeadersCell = pipeline_1.createCell(null);
const useHeaders = () => {
    let headers = pipeline_1.useCellValue(RequestHeadersCell);
    return headers;
};
exports.useHeaders = useHeaders;
const RequestCookiesCell = pipeline_1.createCell(null);
const useCookies = () => {
    let cookies = pipeline_1.useCellValue(RequestCookiesCell);
    return cookies;
};
exports.useCookies = useCookies;
const RequestQuereyCell = pipeline_1.createCell(null);
const useQuery = () => {
    let query = pipeline_1.useCellValue(RequestQuereyCell);
    return query;
};
exports.useQuery = useQuery;
const createHttpPipeline = (options) => {
    let config = {
        ...options,
    };
    let pipeline = pipeline_1.createPipeline();
    let middleware = (request, next) => {
        let ctx = pipeline_1.useContext();
        return pipeline.run(request, {
            context: ctx,
            onLast: () => next(),
        });
    };
    let handleRequest = async (req, res) => {
        var _a, _b, _c, _d;
        if (typeof req.url !== 'string') {
            throw new Error(`req.url is not existed`);
        }
        let url = req.url;
        let [pathname = '/', search = ''] = url.split('?');
        let method = (_a = req.method) !== null && _a !== void 0 ? _a : 'GET';
        let query = qs_1.parse(search, config.query);
        let body = await getBody(req, config.body);
        let headers = req.headers;
        let cookies = cookie_1.parse((_b = req.headers['cookie']) !== null && _b !== void 0 ? _b : '', config.cookie);
        let { basename, requestInfo } = basenames_1.handleBasenames((_c = config.basenames) !== null && _c !== void 0 ? _c : [], {
            pathname,
            method,
            query,
            body,
            headers,
            cookies,
        });
        let storages = (_d = config.contexts) === null || _d === void 0 ? void 0 : _d.call(config);
        let context = pipeline_1.createContext({
            ...storages,
            request: RequestCell.create(req),
            response: ResponseCell.create(res),
            basenames: basenames_1.BasenamesCell.create([basename]),
            headers: RequestHeadersCell.create(headers),
            cookies: RequestCookiesCell.create(cookies),
            query: RequestQuereyCell.create(query),
        });
        let responser = await pipeline.run(requestInfo, {
            context,
            onLast: () => response_1.Response.status(404).text('404 Not Found'),
        });
        return exports.handleResponse({
            req,
            res,
            requestInfo: requestInfo,
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
                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Content-Length', Buffer.byteLength(message));
            }
            if (!res.writableEnded) {
                res.end(Buffer.from(message));
            }
        }
    };
    let add = (...args) => {
        if (args.length === 1) {
            pipeline.add(args[0]);
        }
        else {
            route(...args);
        }
    };
    let run = pipeline.run;
    let listen = (...args) => {
        let server = http_1.createServer(handle);
        server.listen(...args);
        return server;
    };
    let route = (name, middleware) => {
        add(basenames_1.route(name, middleware));
    };
    return {
        add,
        route,
        run,
        handle,
        listen,
        middleware,
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
    let basenames = context.read(basenames_1.BasenamesCell);
    let prefix = basenames.join('');
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
        if (url === 'back') {
            let referrer = req.headers['referer'] + '' || '/';
            url = referrer;
        }
        // handle routename and basename
        if (body.usePrefix && !url.startsWith('//') && url.startsWith('/')) {
            url = prefix + url;
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
    let handleFile = async (filename) => {
        try {
            await access(filename, fs_1.default.constants.F_OK | fs_1.default.constants.R_OK);
        }
        catch (error) {
            await exports.handleResponse({
                ...params,
                responseInfo: response_1.Response.status(404).text(error.message).info,
            });
            return;
        }
        let stream = fs_1.default.createReadStream(filename);
        let ext = path_1.default.extname(filename);
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
const access = util_1.promisify(fs_1.default.access);
