"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.match = exports.Response = exports.createResponse = exports.toResponse = void 0;
const responseInfo_1 = require("./responseInfo");
const toResponse = (f, info) => {
    return (...args) => exports.createResponse(responseInfo_1.merge(info, f(...args)));
};
exports.toResponse = toResponse;
const createResponse = (info) => {
    return {
        info,
        merge: (...responsers) => {
            let infos = responsers.map((responser) => responser.info);
            return exports.createResponse(responseInfo_1.merge(info, ...infos));
        },
        json: exports.toResponse(responseInfo_1.json, info),
        html: exports.toResponse(responseInfo_1.html, info),
        text: exports.toResponse(responseInfo_1.text, info),
        raw: exports.toResponse(responseInfo_1.raw, info),
        redirect: exports.toResponse(responseInfo_1.redirect, info),
        stream: exports.toResponse(responseInfo_1.stream, info),
        file: exports.toResponse(responseInfo_1.file, info),
        vary: exports.toResponse(responseInfo_1.vary, info),
        cookie: exports.toResponse(responseInfo_1.cookie, info),
        cookies: exports.toResponse(responseInfo_1.cookies, info),
        header: exports.toResponse(responseInfo_1.header, info),
        headers: exports.toResponse(responseInfo_1.headers, info),
        status: exports.toResponse(responseInfo_1.status, info),
        buffer: exports.toResponse(responseInfo_1.buffer, info),
        empty: exports.toResponse(responseInfo_1.empty, info),
        attachment: exports.toResponse(responseInfo_1.attachment, info),
        custom: exports.toResponse(responseInfo_1.custom, info),
        type: exports.toResponse(responseInfo_1.type, info)
    };
};
exports.createResponse = createResponse;
exports.Response = exports.createResponse(responseInfo_1.empty());
const match = (type, f) => {
    return async (request, next) => {
        var _a;
        let response = await next(request);
        if (((_a = response.info.body) === null || _a === void 0 ? void 0 : _a.type) === type) {
            return response.merge(await f(response.info.body));
        }
        return response;
    };
};
exports.match = match;
