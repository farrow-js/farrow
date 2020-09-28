import { createCell, createContext, CellStorage, Cell, Context, useCell, useCellValue, useContext } from './context';
import { Next } from './counter';
export { Next };
export { createCell, createContext, CellStorage, Cell, Context, useCellValue, useCell, useContext };
export declare type Middleware<I = unknown, O = unknown> = (input: I, next: Next<I, O>) => O;
export declare type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[];
export declare const isPipeline: (input: any) => input is Pipeline<unknown, unknown>;
declare const PipelineSymbol: unique symbol;
declare type PipelineSymbol = typeof PipelineSymbol;
export declare type PipelineOptions<O = unknown> = {
    defaultOutput?: O;
    contexts?: CellStorage;
};
export declare type Pipeline<I = unknown, O = unknown> = {
    [PipelineSymbol]: true;
    add: (input: Middleware<I, O>) => void;
    run: (input: I, context?: Context) => O;
};
export declare const createPipeline: <I, O>(options?: PipelineOptions<O> | undefined) => Pipeline<I, O>;
export declare type PipelineInput<T extends Pipeline> = T extends Pipeline<infer I> ? I : never;
export declare type PipelineOutput<T extends Pipeline> = T extends Pipeline<any, infer O> ? O : never;
export declare const usePipeline: <I, O>(pipeline: Pipeline<I, O>) => (input: I) => O;
