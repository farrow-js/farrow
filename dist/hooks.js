"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHooks = void 0;
exports.createHooks = function (defaultHooks) {
    var currentHooks = {};
    var hooks = {};
    var _loop_1 = function (key) {
        var f = (function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var handler = currentHooks[key];
            // tslint:disable-next-line: strict-type-predicates
            if (typeof handler !== 'function') {
                handler = defaultHooks[key];
            }
            return handler.apply(void 0, __spread(args));
        });
        hooks[key] = f;
    };
    for (var key in defaultHooks) {
        _loop_1(key);
    }
    var run = function (f, implementations) {
        try {
            currentHooks = implementations || defaultHooks;
            return f();
        }
        finally {
            currentHooks = defaultHooks;
        }
    };
    return { run: run, hooks: hooks };
};
