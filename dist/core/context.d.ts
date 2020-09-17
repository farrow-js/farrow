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
export declare const ContextManagerRequestSymbol: unique symbol;
declare type ContextManagerRequest = typeof ContextManagerRequestSymbol;
export declare type ContextManagerGenerator<T extends any = void> = AsyncGenerator<ContextManagerRequest, T, ContextManager>;
export declare const ContextManagerSymbol: unique symbol;
export declare type ContextManagerSymbol = typeof ContextManagerSymbol;
export declare const isContextManager: (input: any) => input is ContextManager;
declare type AssertContextManager = (input: any) => asserts input is ContextManager;
export declare const assertContextManager: AssertContextManager;
export declare type ContextManager = {
    [ContextManagerSymbol]: true;
    read: <V>(ContextCell: ContextCell<V>) => V;
    write: <V>(ContextCell: ContextCell<V>, value: V) => void;
    run: <T = void>(gen: ContextManagerGenerator<T>) => Promise<T>;
};
export declare const createContextManager: (ContextStorage?: ContextStorage) => ContextManager;
export {};
