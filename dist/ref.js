"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRef = exports.FARROW_REF = void 0;
exports.FARROW_REF = Symbol('farrow.ref');
exports.createRef = function (name) {
    var _a;
    if (name === void 0) { name = 'ref'; }
    return _a = {},
        _a[exports.FARROW_REF] = Symbol(name),
        _a;
};
