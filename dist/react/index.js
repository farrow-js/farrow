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
exports.useReactView = exports.renderToNodeStream = exports.renderToString = exports.defaultDocType = exports.usePrefix = exports.useFarrowContext = exports.FarrowContext = void 0;
const react_1 = __importStar(require("react"));
const server_1 = __importDefault(require("react-dom/server"));
const stream_1 = require("stream");
const multistream_1 = __importDefault(require("multistream"));
const Http = __importStar(require("../http"));
const response_1 = require("../http/response");
exports.FarrowContext = react_1.default.createContext(null);
const useFarrowContext = () => {
    let ctx = react_1.useContext(exports.FarrowContext);
    if (!ctx) {
        throw new Error(`You may forget to add farrow context provider`);
    }
    return ctx;
};
exports.useFarrowContext = useFarrowContext;
const usePrefix = () => {
    let ctx = exports.useFarrowContext();
    return ctx.basenames.join('');
};
exports.usePrefix = usePrefix;
exports.defaultDocType = `<!doctype html>`;
const renderToString = (element, options) => {
    var _a;
    let html = server_1.default.renderToString(element);
    let docType = (_a = options === null || options === void 0 ? void 0 : options.docType) !== null && _a !== void 0 ? _a : exports.defaultDocType;
    return response_1.Response.html(`${docType}\n${html}`);
};
exports.renderToString = renderToString;
const renderToNodeStream = (element, options) => {
    var _a;
    let contentStream = server_1.default.renderToNodeStream(element);
    let docType = (_a = options === null || options === void 0 ? void 0 : options.docType) !== null && _a !== void 0 ? _a : exports.defaultDocType;
    let docTypeStream = new stream_1.Stream.Readable({
        read() {
            this.push(`${docType}\n`);
            this.push(null);
        },
    });
    let stream = new multistream_1.default([docTypeStream, contentStream]);
    return response_1.Response.type('html').stream(stream);
};
exports.renderToNodeStream = renderToNodeStream;
const useReactView = (options) => {
    let basenames = Http.useBasenames();
    let config = {
        ...options,
        useStream: true,
    };
    let render = (element) => {
        let context = {
            basenames,
        };
        let view = react_1.default.createElement(exports.FarrowContext.Provider, { value: context }, element);
        if (config.useStream) {
            return exports.renderToNodeStream(view);
        }
        else {
            return exports.renderToString(view);
        }
    };
    return {
        render,
    };
};
exports.useReactView = useReactView;
