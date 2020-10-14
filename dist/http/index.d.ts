/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { Options as BodyOptions } from 'co-body';
import { CookieParseOptions as CookieOptions } from 'cookie';
import { IParseOptions as QueryOptions } from 'qs';
import { Middleware, PipelineOptions, Context } from '../core/pipeline';
import { MaybeAsyncResponse, Response } from './response';
import { ResponseInfo } from './responseInfo';
import { useBasename } from './basename';
import { useRoutename } from './routename';
export { Response, ResponseInfo };
export { useRoutename, useBasename };
export declare const useRequest: () => IncomingMessage;
export declare const useResponse: () => ServerResponse;
export declare const useReq: () => IncomingMessage;
export declare const useRes: () => ServerResponse;
export declare type RequestInfo = {
    pathname: string;
    method?: string;
    query?: Record<string, any>;
    body?: any;
    headers?: Record<string, any>;
    cookies?: Record<string, any>;
};
export declare type ResponseOutput = MaybeAsyncResponse;
export interface HttpPipelineOptions extends PipelineOptions {
    body?: BodyOptions;
    cookie?: CookieOptions;
    query?: QueryOptions;
}
export declare type HttpMiddleware = Middleware<RequestInfo, ResponseOutput>;
export declare const createHttpPipeline: (options: HttpPipelineOptions) => {
    add: (input: Middleware<RequestInfo, MaybeAsyncResponse>) => void;
    route: (name: string, middleware: HttpMiddleware) => void;
    run: (input: RequestInfo, options?: import("../core/pipeline").RunPipelineOptions<RequestInfo, MaybeAsyncResponse> | undefined) => MaybeAsyncResponse;
    handle: (req: IncomingMessage, res: ServerResponse) => Promise<any>;
    listen: (port: number, callback?: Function | undefined) => import("http").Server;
};
export declare type ResponseParams = {
    requestInfo: RequestInfo;
    responseInfo: ResponseInfo;
    req: IncomingMessage;
    res: ServerResponse;
    context: Context;
};
export declare const handleResponse: (params: ResponseParams) => Promise<any>;
