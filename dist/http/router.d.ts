import { Next, Middleware, RunPipelineOptions } from '../core/pipeline';
import * as Schema from '../core/schema';
import { MaybeAsyncResponse } from './response';
import { BodyMap } from './responseInfo';
export declare type RouterPipelineOptions = {
    pathname: string;
    method?: string;
    params?: Schema.Type;
    query?: Schema.Type;
    body?: Schema.Type;
    headers?: Schema.Type;
    cookies?: Schema.Type;
};
export declare type RequestSchema<T extends RouterPipelineOptions> = Schema.Type<{
    [key in keyof T]: T[key] extends Schema.Type ? Schema.RawType<T[key]> : T[key];
}>;
export declare type RouterRequest<T extends RouterPipelineOptions> = Schema.RawType<RequestSchema<T>>;
export declare type RouterPipeline<I, O> = {
    middleware: <T extends RouterInput>(input: T, next: Next<T, O>) => O;
    add: (input: Middleware<I, O>) => void;
    run: (input: I, options?: RunPipelineOptions<I, O>) => O;
    match: <T extends keyof BodyMap>(type: T, f: (body: BodyMap[T]) => MaybeAsyncResponse) => void;
    route: (name: string, middleware: Middleware<I, O>) => void;
};
export declare type RouterInput = {
    pathname: string;
    method?: string;
};
export declare const createRouterPipeline: <T extends RouterPipelineOptions>(options: T) => RouterPipeline<{ [key in keyof T]: T[key] extends Schema.Type<any> ? Schema.RawType<T[key]> : T[key]; }, MaybeAsyncResponse>;
