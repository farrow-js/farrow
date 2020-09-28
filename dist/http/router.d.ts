import { Next, Middleware, Context } from '../core/pipeline';
import * as Schema from '../core/schema';
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
declare type MaybePromise<T> = T | Promise<T>;
export declare type RouterRequest<T extends RouterPipelineOptions> = Schema.RawType<RequestSchema<T>>;
export declare type RouterResponse = MaybePromise<Schema.Term>;
export declare type RouterPipeline<I, O> = {
    middleware: <T extends RouterInput>(input: T, next: Next<T, O>) => O;
    add: (input: Middleware<I, O>) => void;
    run: (input: I, context?: Context | undefined) => O;
};
export declare type RouterInput = {
    pathname: string;
    method?: string;
};
export declare const createRouterPipeline: <T extends RouterPipelineOptions>(options: T) => RouterPipeline<{ [key in keyof T]: T[key] extends Schema.Type<any> ? Schema.RawType<T[key]> : T[key]; }, MaybePromise<Schema.Term<any>>>;
export {};
