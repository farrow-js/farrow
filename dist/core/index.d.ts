import { createContextCell, createContextManager, ContextStorage, ContextCell, ContextManager, useCell, useCellValue, useManager } from './context';
import { Next } from './counter';
export { Next };
export { createContextCell, createContextManager, ContextStorage, ContextCell, ContextManager, useCellValue, useCell, useManager, };
export declare type Middleware<I = unknown, O = unknown> = (input: I, next: Next<I, O>) => O;
export declare type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[];
export declare const isPipeline: (input: any) => input is Pipeline<unknown, unknown>;
declare const PipelineSymbol: unique symbol;
declare type PipelineSymbol = typeof PipelineSymbol;
export declare type PipelineOptions<O = unknown> = {
    defaultOutput?: O;
    contexts?: ContextStorage;
};
export declare type MaybePromise<T> = T | Promise<T>;
export declare type Pipeline<I = unknown, O = unknown> = {
    [PipelineSymbol]: true;
    add: (input: Middleware<I, MaybePromise<O>>) => void;
    run: (input: I, manager?: ContextManager) => Promise<O>;
};
export declare const createPipeline: <I, O>(options?: PipelineOptions<O> | undefined) => Pipeline<I, O>;
