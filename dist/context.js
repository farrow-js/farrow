"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = exports.getContextValue = exports.mergeContextItems = exports.FARROW_CONTEXT = void 0;
exports.FARROW_CONTEXT = Symbol('farrow.context');
exports.mergeContextItems = (...args) => {
    let merged = {
        [exports.FARROW_CONTEXT]: {}
    };
    for (let i = 0; i < args.length; i++) {
        Object.assign(merged[exports.FARROW_CONTEXT], args[i][exports.FARROW_CONTEXT]);
    }
    return merged;
};
exports.getContextValue = (ContextItem, id) => {
    let obj = ContextItem[exports.FARROW_CONTEXT];
    if (obj && obj.hasOwnProperty(id)) {
        return obj[id];
    }
    return null;
};
let offsetForContext = 0;
const getContextId = () => offsetForContext++;
exports.createContext = (initialValue) => {
    let id = `farrow.context.${getContextId()}`;
    let impl = (value) => {
        return {
            [id]: {
                value
            }
        };
    };
    let create = (value) => {
        return { [exports.FARROW_CONTEXT]: impl(value) };
    };
    return {
        id,
        initialValue,
        impl,
        create
    };
};
