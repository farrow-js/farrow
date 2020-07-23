"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMiddlewares = void 0;
exports.runMiddlewares = function (middlewares, next) {
    var latestIndex = -1;
    var dispatch = function (index) {
        if (index <= latestIndex) {
            var error = new Error("Middleware called next() multiple times");
            return Promise.reject(error);
        }
        if (index === middlewares.length) {
            return Promise.resolve(next());
        }
        latestIndex = index;
        var fn = middlewares[index];
        try {
            return Promise.resolve(fn(dispatch.bind(null, index + 1)));
        }
        catch (error) {
            return Promise.reject(error);
        }
    };
    return dispatch(0);
};
