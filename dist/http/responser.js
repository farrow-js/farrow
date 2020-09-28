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
exports.StatusResponser = exports.status = exports.HTMLResponser = exports.html = exports.TextResponser = exports.text = exports.JsonResponser = exports.json = void 0;
const index_1 = require("./index");
const Schema = __importStar(require("../core/schema"));
const statuses_1 = __importDefault(require("statuses"));
exports.json = Schema.json;
exports.JsonResponser = index_1.createResponser(exports.json, (params) => {
    var _a;
    let { data, res } = params;
    let content = JSON.stringify(data);
    let contentLength = Buffer.byteLength(content);
    res.statusCode = 200;
    res.statusMessage = (_a = statuses_1.default.message[200]) !== null && _a !== void 0 ? _a : '';
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', contentLength);
    res.end(content);
});
exports.text = Schema.createType({
    toJSON: () => {
        return {
            type: 'Text',
        };
    },
    validate: (input) => {
        return Schema.string.validate(input);
    },
});
exports.TextResponser = index_1.createResponser(exports.text, (params) => {
    var _a;
    let { data, res } = params;
    let content = data;
    let contentLength = Buffer.byteLength(content);
    res.statusCode = 200;
    res.statusMessage = (_a = statuses_1.default.message[200]) !== null && _a !== void 0 ? _a : '';
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', contentLength);
    res.end(content);
});
exports.html = Schema.createType({
    toJSON: () => {
        return {
            type: 'HTML',
        };
    },
    validate: (input) => {
        return Schema.string.validate(input);
    },
});
exports.HTMLResponser = index_1.createResponser(exports.html, (params) => {
    var _a;
    let { data, res } = params;
    let content = data;
    let contentLength = Buffer.byteLength(content);
    res.statusCode = 200;
    res.statusMessage = (_a = statuses_1.default.message[200]) !== null && _a !== void 0 ? _a : '';
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', contentLength);
    res.end(content);
});
exports.status = Schema.object({
    code: Schema.number,
    message: Schema.nullable(Schema.string),
});
exports.StatusResponser = index_1.createResponser(exports.status, (params) => {
    var _a;
    let { data, res } = params;
    let { code, message } = data;
    res.statusCode = data.code;
    res.statusMessage = message || ((_a = statuses_1.default.message[code]) !== null && _a !== void 0 ? _a : '');
    res.end();
});
