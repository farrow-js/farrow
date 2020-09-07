"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMiddlewares = void 0;
exports.runMiddlewares = (middlewares, next) => {
    let latestIndex = -1;
    let dispatch = (index) => {
        if (index <= latestIndex) {
            let error = new Error(`Middleware called next() multiple times`);
            return Promise.reject(error);
        }
        if (index === middlewares.length) {
            return Promise.resolve(next());
        }
        latestIndex = index;
        let fn = middlewares[index];
        try {
            return Promise.resolve(fn(dispatch.bind(null, index + 1)));
        }
        catch (error) {
            return Promise.reject(error);
        }
    };
    return dispatch(0);
};
