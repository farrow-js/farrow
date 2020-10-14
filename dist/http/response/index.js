"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.match = exports.createResponser = exports.toResponser = void 0;
const response_1 = require("./response");
const toResponser = (f, info) => {
    return (...args) => exports.createResponser(response_1.merge(info, f(...args)));
};
exports.toResponser = toResponser;
const createResponser = (info) => {
    return {
        info,
        merge: (...responsers) => {
            let infos = responsers.map((responser) => responser.info);
            return exports.createResponser(response_1.merge(info, ...infos));
        },
        json: exports.toResponser(response_1.json, info),
        html: exports.toResponser(response_1.html, info),
        text: exports.toResponser(response_1.text, info),
        raw: exports.toResponser(response_1.raw, info),
        redirect: exports.toResponser(response_1.redirect, info),
        stream: exports.toResponser(response_1.stream, info),
        file: exports.toResponser(response_1.file, info),
        vary: exports.toResponser(response_1.vary, info),
        cookie: exports.toResponser(response_1.cookie, info),
        cookies: exports.toResponser(response_1.cookies, info),
        header: exports.toResponser(response_1.header, info),
        headers: exports.toResponser(response_1.headers, info),
        status: exports.toResponser(response_1.status, info),
        buffer: exports.toResponser(response_1.buffer, info),
        empty: exports.toResponser(response_1.empty, info),
        attachment: exports.toResponser(response_1.attachment, info),
        custom: exports.toResponser(response_1.custom, info),
    };
};
exports.createResponser = createResponser;
exports.default = exports.createResponser(response_1.empty());
const match = (type, f) => {
    return async (request, next) => {
        var _a;
        let responser = await next(request);
        if (((_a = responser.info.body) === null || _a === void 0 ? void 0 : _a.type) === type) {
            return responser.merge(await f(responser.info.body));
        }
        return responser;
    };
};
exports.match = match;
