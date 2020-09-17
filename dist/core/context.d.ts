declare const ContextCellSymbol: unique symbol;
export declare type ContextCell<T = any> = {
    id: symbol;
    [ContextCellSymbol]: T;
    create: (value: T) => ContextCell<T>;
};
export declare const isContextCell: (input: any) => input is ContextCell<any>;
declare type AssertContextCell = (input: any) => asserts input is ContextCell;
export declare const assertContextCell: AssertContextCell;
export declare const createContextCell: <T>(value: T) => ContextCell<T>;
export declare type ContextStorage = {
    [key: string]: ContextCell;
};
export declare const ContextManagerSymbol: unique symbol;
export declare type ContextManagerSymbol = typeof ContextManagerSymbol;
export declare const isContextManager: (input: any) => input is ContextManager;
declare type AssertContextManager = (input: any) => asserts input is ContextManager;
export declare const assertContextManager: AssertContextManager;
export declare type ContextManager = {
    [ContextManagerSymbol]: true;
    read: <V>(ContextCell: ContextCell<V>) => V;
    write: <V>(ContextCell: ContextCell<V>, value: V) => void;
};
export declare const createContextManager: (ContextStorage?: ContextStorage) => ContextManager;
export declare type Hooks = {
    useManager: () => ContextManager;
    useCell: <T>(Cell: ContextCell<T>) => {
        value: T;
    };
    useCellValue: <T>(Cell: ContextCell<T>) => T;
};
export declare const runContextHooks: <F extends (...args: any) => any>(f: F, implementations: Hooks) => ReturnType<F>;
export declare const useManager: () => ContextManager, useCell: <T>(Cell: ContextCell<T>) => {
    value: T;
}, useCellValue: <T>(Cell: ContextCell<T>) => T;
export declare const fromManager: (manager: ContextManager) => Hooks;
export {};
