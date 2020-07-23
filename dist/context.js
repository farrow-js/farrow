"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = exports.getContextValue = exports.mergeContextItems = exports.FARROW_CONTEXT = void 0;
exports.FARROW_CONTEXT = Symbol('farrow.context');
exports.mergeContextItems = function () {
    var _a;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var merged = (_a = {},
        _a[exports.FARROW_CONTEXT] = {},
        _a);
    for (var i = 0; i < args.length; i++) {
        Object.assign(merged[exports.FARROW_CONTEXT], args[i][exports.FARROW_CONTEXT]);
    }
    return merged;
};
exports.getContextValue = function (ContextItem, id) {
    var obj = ContextItem[exports.FARROW_CONTEXT];
    if (obj && obj.hasOwnProperty(id)) {
        return obj[id];
    }
    return null;
};
var offsetForContext = 0;
var getContextId = function () { return offsetForContext++; };
exports.createContext = function (initialValue) {
    var id = "farrow.context." + getContextId();
    var impl = function (value) {
        var _a;
        return _a = {},
            _a[id] = {
                value: value
            },
            _a;
    };
    var create = function (value) {
        var _a;
        return _a = {}, _a[exports.FARROW_CONTEXT] = impl(value), _a;
    };
    return {
        id: id,
        initialValue: initialValue,
        impl: impl,
        create: create
    };
};
