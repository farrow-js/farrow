"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContextManager = exports.assertContextManager = exports.isContextManager = exports.ContextManagerSymbol = exports.ContextManagerRequestSymbol = exports.createContextCell = exports.assertContextCell = exports.isContextCell = void 0;
const ContextCellSymbol = Symbol('ContextCell');
const isContextCell = (input) => {
    return !!(input === null || input === void 0 ? void 0 : input.hasOwnProperty(ContextCellSymbol));
};
exports.isContextCell = isContextCell;
const assertContextCell = input => {
    if (!exports.isContextCell(input)) {
        throw new Error(`Expected ContextCell, but received ${input}`);
    }
};
exports.assertContextCell = assertContextCell;
const createContextCell = (value) => {
    let id = Symbol('ContextCellID');
    let create = (value) => {
        return {
            id,
            [ContextCellSymbol]: value,
            create
        };
    };
    return create(value);
};
exports.createContextCell = createContextCell;
exports.ContextManagerRequestSymbol = Symbol('ContextManagerRequest');
exports.ContextManagerSymbol = Symbol('ContextManager');
const isContextManager = (input) => {
    return !!(input && input[exports.ContextManagerSymbol]);
};
exports.isContextManager = isContextManager;
const assertContextManager = input => {
    if (!exports.isContextManager(input)) {
        throw new Error(`Expected ContextManager, but received ${input}`);
    }
};
exports.assertContextManager = assertContextManager;
const createCellMap = (storage) => {
    let cellMap = new Map();
    Object.values(storage).forEach(cell => {
        cellMap.set(cell.id, cell);
    });
    return cellMap;
};
const createContextManager = (ContextStorage = {}) => {
    let cellMap = createCellMap(ContextStorage);
    let read = inputCell => {
        let target = cellMap.get(inputCell.id);
        if (target) {
            return target[ContextCellSymbol];
        }
        return inputCell[ContextCellSymbol];
    };
    let write = (inputCell, value) => {
        cellMap.set(inputCell.id, inputCell.create(value));
    };
    let run = (gen) => {
        let next = (result) => {
            if (result.done) {
                return Promise.resolve(result.value);
            }
            if (result.value !== exports.ContextManagerRequestSymbol) {
                throw new Error(`Please use yield* instead of yield`);
            }
            return gen.next(manager).then(next);
        };
        return gen.next(manager).then(next);
    };
    let manager = Object.freeze({
        [exports.ContextManagerSymbol]: true,
        read,
        write,
        run
    });
    return manager;
};
exports.createContextManager = createContextManager;
