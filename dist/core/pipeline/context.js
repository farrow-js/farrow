"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromContext = exports.useCellValue = exports.useCell = exports.useContext = exports.runContextHooks = exports.createContext = exports.assertContext = exports.isContext = exports.ContextSymbol = exports.createCell = exports.assertCell = exports.isCell = void 0;
const hook_1 = require("./hook");
const CellSymbol = Symbol('Cell');
const isCell = (input) => {
    return !!(input === null || input === void 0 ? void 0 : input.hasOwnProperty(CellSymbol));
};
exports.isCell = isCell;
const assertCell = (input) => {
    if (!exports.isCell(input)) {
        throw new Error(`Expected Cell, but received ${input}`);
    }
};
exports.assertCell = assertCell;
const createCell = (value) => {
    let id = Symbol('CellID');
    let create = (value) => {
        return {
            id,
            [CellSymbol]: value,
            create,
        };
    };
    return create(value);
};
exports.createCell = createCell;
exports.ContextSymbol = Symbol('Context');
const isContext = (input) => {
    return !!(input && input[exports.ContextSymbol]);
};
exports.isContext = isContext;
const assertContext = (input) => {
    if (!exports.isContext(input)) {
        throw new Error(`Expected Context, but received ${input}`);
    }
};
exports.assertContext = assertContext;
const createCellMap = (storage) => {
    let cellMap = new Map();
    Object.values(storage).forEach((cell) => {
        cellMap.set(cell.id, cell);
    });
    return cellMap;
};
const createContext = (ContextStorage = {}) => {
    let cellMap = createCellMap(ContextStorage);
    let read = (inputCell) => {
        let target = cellMap.get(inputCell.id);
        if (target) {
            return target[CellSymbol];
        }
        return inputCell[CellSymbol];
    };
    let write = (inputCell, value) => {
        cellMap.set(inputCell.id, inputCell.create(value));
    };
    let context = Object.freeze({
        [exports.ContextSymbol]: true,
        read,
        write,
    });
    return context;
};
exports.createContext = createContext;
const { run, hooks } = hook_1.createHooks({
    useContext: () => {
        throw new Error(`Can't call useContext out of scope, it should be placed on top of the function`);
    },
    useCell: () => {
        throw new Error(`Can't call useCell out of scope, it should be placed on top of the function`);
    },
    useCellValue: () => {
        throw new Error(`Can't call useCellValue out of scope, it should be placed on top of the function`);
    },
});
exports.runContextHooks = run;
exports.useContext = hooks.useContext, exports.useCell = hooks.useCell, exports.useCellValue = hooks.useCellValue;
const fromContext = (context) => ({
    useContext: () => {
        return context;
    },
    useCell: (Cell) => {
        return Object.seal({
            get value() {
                return context.read(Cell);
            },
            set value(v) {
                context.write(Cell, v);
            },
        });
    },
    useCellValue: (Cell) => {
        return context.read(Cell);
    },
});
exports.fromContext = fromContext;
