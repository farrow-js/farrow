"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromManager = exports.useCellValue = exports.useCell = exports.useManager = exports.runContextHooks = exports.createContextManager = exports.assertContextManager = exports.isContextManager = exports.ContextManagerSymbol = exports.createContextCell = exports.assertContextCell = exports.isContextCell = void 0;
const hook_1 = require("./hook");
const ContextCellSymbol = Symbol('ContextCell');
const isContextCell = (input) => {
    return !!(input === null || input === void 0 ? void 0 : input.hasOwnProperty(ContextCellSymbol));
};
exports.isContextCell = isContextCell;
const assertContextCell = (input) => {
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
            create,
        };
    };
    return create(value);
};
exports.createContextCell = createContextCell;
exports.ContextManagerSymbol = Symbol('ContextManager');
const isContextManager = (input) => {
    return !!(input && input[exports.ContextManagerSymbol]);
};
exports.isContextManager = isContextManager;
const assertContextManager = (input) => {
    if (!exports.isContextManager(input)) {
        throw new Error(`Expected ContextManager, but received ${input}`);
    }
};
exports.assertContextManager = assertContextManager;
const createCellMap = (storage) => {
    let cellMap = new Map();
    Object.values(storage).forEach((cell) => {
        cellMap.set(cell.id, cell);
    });
    return cellMap;
};
const createContextManager = (ContextStorage = {}) => {
    let cellMap = createCellMap(ContextStorage);
    let read = (inputCell) => {
        let target = cellMap.get(inputCell.id);
        if (target) {
            return target[ContextCellSymbol];
        }
        return inputCell[ContextCellSymbol];
    };
    let write = (inputCell, value) => {
        cellMap.set(inputCell.id, inputCell.create(value));
    };
    let manager = Object.freeze({
        [exports.ContextManagerSymbol]: true,
        read,
        write,
    });
    return manager;
};
exports.createContextManager = createContextManager;
const { run, hooks } = hook_1.createHooks({
    useManager: () => {
        throw new Error(`Can't call useManager out of scope, it should be placed on top of the function`);
    },
    useCell: () => {
        throw new Error(`Can't call useCell out of scope, it should be placed on top of the function`);
    },
    useCellValue: () => {
        throw new Error(`Can't call useCellValue out of scope, it should be placed on top of the function`);
    },
});
exports.runContextHooks = run;
exports.useManager = hooks.useManager, exports.useCell = hooks.useCell, exports.useCellValue = hooks.useCellValue;
const fromManager = (manager) => ({
    useManager: () => {
        return manager;
    },
    useCell: (Cell) => {
        return Object.seal({
            get value() {
                return manager.read(Cell);
            },
            set value(v) {
                manager.write(Cell, v);
            },
        });
    },
    useCellValue: (Cell) => {
        return manager.read(Cell);
    },
});
exports.fromManager = fromManager;
