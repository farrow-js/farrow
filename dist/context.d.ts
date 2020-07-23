export declare const FARROW_CONTEXT: unique symbol;
export declare type ContextItem<T = any> = {
    [FARROW_CONTEXT]: {
        [key: string]: {
            value: T;
        };
    };
};
export declare const mergeContextItems: (...args: ContextItem[]) => ContextItem;
export declare const getContextValue: (ContextItem: ContextItem<any>, id: string) => {
    value: any;
} | null;
export declare type Context<V = any> = {
    id: string;
    impl: (value: V) => {
        [key: string]: {
            value: V;
        };
    };
    initialValue: V;
    create: (value: V) => ContextItem<V>;
};
export declare type ContextValue<T extends Context> = T extends Context<infer V> ? V : never;
export declare const createContext: <V>(initialValue: V) => Context<V>;
