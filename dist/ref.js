"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRef = exports.FARROW_REF = void 0;
exports.FARROW_REF = Symbol('farrow.ref');
exports.createRef = (name = 'ref') => {
    return {
        [exports.FARROW_REF]: Symbol(name)
    };
};
