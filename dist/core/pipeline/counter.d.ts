export declare type Next<I = unknown, O = unknown> = (input?: I) => O;
export declare type CounterCallback<I = unknown, O = unknown> = (index: number, input: I, next: Next<I, O>) => O;
export declare type Counter<I = unknown, O = unknown> = {
    start: (input: I) => O;
    dispatch: (index: number, input: I) => O;
};
export declare const createCounter: <I, O>(callback: CounterCallback<I, O>) => Counter<I, O>;
