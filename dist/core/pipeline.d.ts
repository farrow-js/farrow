import { Next } from './counter';
export { Next };
export declare type Middleware<I = unknown, O = unknown> = (input: I, next: Next<I, O>) => O;
export declare type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[];
export declare const createMiddleware: <T extends Middleware<unknown, unknown>>(f: T) => T;
export declare const isPipeline: (input: any) => input is Pipeline<unknown, unknown>;
declare const PipelineSymbol: unique symbol;
declare type PipelineSymbol = typeof PipelineSymbol;
export declare type Pipeline<I = unknown, O = unknown> = {
    [PipelineSymbol]: true;
    add: (input: Middleware<I, O>) => void;
    run: (input: I) => O;
};
export declare const createPipeline: <I, O>(defaultValue?: typeof PipelineSymbol | O) => Pipeline<I, O>;
