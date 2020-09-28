/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { Options as BodyOptions } from 'co-body';
import { CookieParseOptions as CookieOptions } from 'cookie';
import { IParseOptions as QueryOptions } from 'qs';
import { PipelineOptions } from '../core/pipeline';
import * as Schema from '../core/schema';
export declare type RequestInfo = {
    pathname: string;
    method?: string;
    query?: Record<string, any>;
    body?: any;
    headers?: Record<string, any>;
    cookies?: Record<string, any>;
};
export declare type Response = Schema.Term;
export declare type RequestHandlerParams<T = any> = {
    data: T;
    req: IncomingMessage;
    res: ServerResponse;
    info: RequestInfo;
};
export declare type RequestHandler<T> = (params: RequestHandlerParams<T>) => any;
export declare type Responser<T = any> = {
    Type: Schema.Type<T>;
    handler: RequestHandler<T>;
};
export declare const createResponser: <T>(Type: Schema.Type<T>, handler: RequestHandler<T>) => Responser<T>;
export interface HttpPipelineOptions<T> extends PipelineOptions<T> {
    responsers?: Responser[];
    body?: BodyOptions;
    cookie?: CookieOptions;
    query?: QueryOptions;
}
export declare const createHttpPipeline: (options: HttpPipelineOptions<any>) => {
    add: (input: import("../core/pipeline").Middleware<RequestInfo, Schema.Term<any> | Promise<Schema.Term<any>>>) => void;
    run: (input: RequestInfo, context?: import("../core/pipeline").Context | undefined) => Schema.Term<any> | Promise<Schema.Term<any>>;
    handle: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
    listen: (port: number, callback: () => void) => import("http").Server;
};
