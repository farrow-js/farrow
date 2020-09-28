"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHooks = void 0;
const createHooks = (defaultHooks) => {
    let currentHooks = {};
    let hooks = {};
    for (let key in defaultHooks) {
        let f = ((...args) => {
            let handler = currentHooks[key];
            // tslint:disable-next-line: strict-type-predicates
            if (typeof handler !== 'function') {
                handler = defaultHooks[key];
            }
            return handler(...args);
        });
        hooks[key] = f;
    }
    let run = (f, implementations) => {
        try {
            currentHooks = implementations || defaultHooks;
            return f();
        }
        finally {
            currentHooks = defaultHooks;
        }
    };
    return { run, hooks };
};
exports.createHooks = createHooks;
