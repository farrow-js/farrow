"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpPipeline = exports.createResponser = void 0;
const http_1 = require("http");
const co_body_1 = __importDefault(require("co-body"));
const cookie_1 = require("cookie");
const qs_1 = require("qs");
const type_is_1 = __importDefault(require("type-is"));
const pipeline_1 = require("../core/pipeline");
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
const createResponser = (Type, handler) => {
    return {
        Type,
        handler,
    };
};
exports.createResponser = createResponser;
const createHttpPipeline = (options) => {
    let pipeline = pipeline_1.createPipeline({
        defaultOutput: options.defaultOutput,
        contexts: options.contexts,
    });
    let { responsers = [] } = options;
    let handleRequest = async (req, res) => {
        var _a, _b;
        let url = req.url;
        if (typeof url !== 'string') {
            throw new Error(`req.url is not existed`);
        }
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
        let term = await pipeline.run(requestInfo);
        let matched = false;
        for (let i = 0; i < responsers.length; i++) {
            let responser = responsers[i];
            if (responser.Type.is(term)) {
                let params = {
                    data: term.value,
                    req,
                    res,
                    info: requestInfo,
                };
                matched = true;
                await responser.handler(params);
                break;
            }
        }
        if (!matched) {
            throw new Error(`None of responsers can handle the response: ${term.value}`);
        }
    };
    let handle = async (req, res) => {
        try {
            return await handleRequest(req, res);
        }
        catch (error) {
            res.statusCode = 500;
            res.statusMessage = error.message || '';
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Length', Buffer.byteLength(res.statusMessage));
            res.end(res.statusMessage);
        }
    };
    let add = pipeline.add;
    let run = pipeline.run;
    let listen = (port, callback) => {
        let server = http_1.createServer(handle);
        server.listen(port, callback);
        return server;
    };
    return {
        add,
        run,
        handle,
        listen,
    };
};
exports.createHttpPipeline = createHttpPipeline;
