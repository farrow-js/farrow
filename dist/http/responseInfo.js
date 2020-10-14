"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.merge = exports.vary = exports.cookie = exports.cookies = exports.type = exports.header = exports.headers = exports.status = exports.attachment = exports.file = exports.buffer = exports.stream = exports.custom = exports.redirect = exports.raw = exports.empty = exports.html = exports.text = exports.json = void 0;
const mime_types_1 = __importDefault(require("mime-types"));
const content_disposition_1 = __importDefault(require("content-disposition"));
const json = (value) => {
    return {
        body: {
            type: 'json',
            value,
        },
    };
};
exports.json = json;
const text = (value) => {
    return {
        body: {
            type: 'text',
            value,
        },
    };
};
exports.text = text;
const html = (value) => {
    return {
        body: {
            type: 'html',
            value,
        },
    };
};
exports.html = html;
const empty = () => {
    return {
        body: {
            type: 'empty',
            value: null,
        },
    };
};
exports.empty = empty;
const raw = (value) => {
    return {
        body: {
            type: 'raw',
            value: value,
        },
    };
};
exports.raw = raw;
const redirect = (url, options) => {
    var _a, _b;
    return {
        body: {
            type: 'redirect',
            value: url,
            useBasename: (_a = options === null || options === void 0 ? void 0 : options.useBasename) !== null && _a !== void 0 ? _a : true,
            useRoutename: (_b = options === null || options === void 0 ? void 0 : options.useRoutename) !== null && _b !== void 0 ? _b : true
        },
    };
};
exports.redirect = redirect;
const custom = (handler) => {
    return {
        body: {
            type: 'custom',
            handler,
        },
    };
};
exports.custom = custom;
const stream = (stream) => {
    return {
        body: {
            type: 'stream',
            value: stream,
        },
    };
};
exports.stream = stream;
const buffer = (buffer) => {
    return {
        body: {
            type: 'buffer',
            value: buffer,
        },
    };
};
exports.buffer = buffer;
const file = (filename) => {
    return {
        body: {
            type: 'file',
            value: filename,
        },
    };
};
exports.file = file;
const attachment = (filename, options) => {
    return exports.headers({
        'Content-Disposition': content_disposition_1.default(filename, options),
    });
};
exports.attachment = attachment;
const status = (code, message = '') => {
    return {
        status: {
            code,
            message,
        },
    };
};
exports.status = status;
const headers = (headers) => {
    return {
        headers,
    };
};
exports.headers = headers;
const header = (name, value) => {
    return exports.headers({ [name]: value });
};
exports.header = header;
const type = (type) => {
    let contentType = mime_types_1.default.contentType(type);
    if (contentType === false) {
        return exports.headers({});
    }
    return exports.headers({
        'Content-Type': contentType,
    });
};
exports.type = type;
const cookies = (config, options) => {
    let cookies = {};
    Object.entries(config).forEach(([name, value]) => {
        cookies[name] = {
            value,
            options,
        };
    });
    return {
        cookies,
    };
};
exports.cookies = cookies;
const cookie = (name, value, options) => {
    return exports.cookies({ [name]: value }, options);
};
exports.cookie = cookie;
const vary = (...fileds) => {
    return {
        vary: fileds,
    };
};
exports.vary = vary;
const merge = (...responses) => {
    let result = {};
    responses.forEach((response) => {
        var _a;
        if (response.body) {
            result.body = response.body;
        }
        if (response.status) {
            result.status = Object.assign({}, result.status, response.status);
        }
        if (response.headers) {
            result.headers = Object.assign({}, result.headers, response.headers);
        }
        if (response.cookies) {
            result.cookies = Object.assign({}, result.cookies, response.cookies);
        }
        if (response.vary) {
            result.vary = [...((_a = result.vary) !== null && _a !== void 0 ? _a : []), ...response.vary];
        }
    });
    return result;
};
exports.merge = merge;
