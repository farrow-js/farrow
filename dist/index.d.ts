declare const ContextCellSymbol: unique symbol;
declare type ContextCell<T = any> = {
    id: symbol;
    [ContextCellSymbol]: T;
    create: (value: T) => ContextCell<T>;
};
declare type ContextStorage = {
    [key: string]: ContextCell;
};
declare const ContextManagerRequest: unique symbol;
declare type ContextManagerRequest = typeof ContextManagerRequest;
export declare type ContextManagerGenerator<T extends any = void> = AsyncGenerator<ContextManagerRequest, T, ContextManager>;
export declare type ContextManager = {
    read: <V>(ContextCell: ContextCell<V>) => V;
    write: <V>(ContextCell: ContextCell<V>, value: V) => void;
    run: <T = void>(gen: ContextManagerGenerator<T>) => Promise<T>;
};
export declare const createContextManager: (ContextStorage?: ContextStorage) => ContextManager;
export declare type Next = () => Promise<void>;
export declare type Middleware = ((next: Next, ctx: ContextManager) => ContextManagerGenerator<void>) | ((next: Next, ctx: ContextManager) => Promise<void>);
export declare type Middlewares = Middleware[];
declare type Handler = (next: Next, index: number) => Promise<void>;
export declare const runHandler: (handler: Handler) => Promise<void>;
export declare const createPipeline: () => Readonly<{
    use: (middleware: Middleware) => void;
    run: (manager?: ContextManager) => Promise<void>;
}>;
export {};
