import { Pipeline, createPipeline, isPipeline, Next, Middleware, Middlewares } from './pipeline';
import { createContextCell, createContextManager, ContextStorage, isContextManager, ContextCell, ContextManager, ContextManagerGenerator, assertContextManager, assertContextCell, isContextCell } from './context';
export { createPipeline, Pipeline, Next, Middleware, Middlewares, isPipeline };
export { createContextCell, createContextManager, isContextManager, isContextCell, ContextStorage, ContextCell, ContextManager, ContextManagerGenerator, assertContextManager, assertContextCell, };
export declare type ContextualPipelineOptions<O = unknown> = {
    defaultOutput?: O;
    contexts?: ContextStorage;
};
export declare type ContextualPipeline<I = unknown, O = unknown> = {
    add: (input: Middleware<I, ContextManagerGenerator<O>>) => void;
    run: (input: I, currentManager?: ContextManager) => Promise<O>;
};
export declare const createContextualPipeline: <I, O>(options?: ContextualPipelineOptions<O>) => ContextualPipeline<I, O>;
export declare const createMiddleware: <I, O>(middleware: Middleware<I, ContextManagerGenerator<O>>) => Middleware<I, ContextManagerGenerator<O>>;
declare type HookFunction<Args extends unknown[] = unknown[], T = unknown> = (...args: Args) => ContextManagerGenerator<T>;
export declare const createHook: <Args extends unknown[], T>(f: HookFunction<Args, T>) => (...args: Args) => ContextManagerGenerator<T>;
export declare const useManager: () => ContextManagerGenerator<ContextManager>;
export declare const useCell: <T>(ContextCell: ContextCell<T>) => ContextManagerGenerator<{
    value: T;
}>;
export declare const usePipeline: <I, O>(pipeline: ContextualPipeline<I, O>, input: I) => ContextManagerGenerator<O>;
export declare const useCellValue: <T>(ContextCell: ContextCell<T>) => ContextManagerGenerator<T>;
