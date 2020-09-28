declare const CellSymbol: unique symbol;
export declare type Cell<T = any> = {
    id: symbol;
    [CellSymbol]: T;
    create: (value: T) => Cell<T>;
};
export declare const isCell: (input: any) => input is Cell<any>;
declare type AssertCell = (input: any) => asserts input is Cell;
export declare const assertCell: AssertCell;
export declare const createCell: <T>(value: T) => Cell<T>;
export declare type CellStorage = {
    [key: string]: Cell;
};
export declare const ContextSymbol: unique symbol;
export declare type ContextSymbol = typeof ContextSymbol;
export declare const isContext: (input: any) => input is Context;
declare type AssertContext = (input: any) => asserts input is Context;
export declare const assertContext: AssertContext;
export declare type Context = {
    [ContextSymbol]: true;
    read: <V>(Cell: Cell<V>) => V;
    write: <V>(Cell: Cell<V>, value: V) => void;
};
export declare const createContext: (ContextStorage?: CellStorage) => Context;
export declare type Hooks = {
    useContext: () => Context;
    useCell: <T>(Cell: Cell<T>) => {
        value: T;
    };
    useCellValue: <T>(Cell: Cell<T>) => T;
};
export declare const runContextHooks: <F extends (...args: any) => any>(f: F, implementations: Hooks) => ReturnType<F>;
export declare const useContext: () => Context, useCell: <T>(Cell: Cell<T>) => {
    value: T;
}, useCellValue: <T>(Cell: Cell<T>) => T;
export declare const fromContext: (context: Context) => Hooks;
export {};
