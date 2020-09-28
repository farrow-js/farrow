"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCounter = void 0;
const createCounter = (callback) => {
    let dispatch = (index, input) => {
        let next = (nextInput = input) => dispatch(index + 1, nextInput);
        return callback(index, input, next);
    };
    let start = (input) => {
        return dispatch(0, input);
    };
    return {
        start,
        dispatch,
    };
};
exports.createCounter = createCounter;
