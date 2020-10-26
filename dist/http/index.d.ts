/// <reference types="node" />
import { IncomingMessage, Server, ServerResponse } from 'http';
import path from 'path';
import { Options as BodyOptions } from 'co-body';
import { CookieParseOptions as CookieOptions } from 'cookie';
import { IParseOptions as QueryOptions } from 'qs';
import { Middleware, Context, CellStorage } from '../core/pipeline';
import { MaybeAsyncResponse, Response } from './response';
import { ResponseInfo } from './responseInfo';
import { useBasenames, usePrefix } from './basenames';
import { createRouterPipeline } from './router';
export { createRouterPipeline };
export { Response, ResponseInfo };
export { useBasenames, usePrefix };
export declare const useRequest: () => IncomingMessage | null;
export declare const useResponse: () => ServerResponse | null;
export declare const useReq: () => IncomingMessage | null;
export declare const useRes: () => ServerResponse | null;
export declare type RequestHeaders = Record<string, string>;
export declare const useHeaders: () => Record<string, string> | null;
export declare type RequestCookies = Record<string, string>;
export declare const useCookies: () => Record<string, string> | null;
export declare type RequestQuery = Record<string, string | string[]>;
export declare const useQuery: () => Record<string, string | string[]> | null;
export declare type RequestInfo = {
    pathname: string;
    method?: string;
    query?: RequestQuery;
    body?: any;
    headers?: RequestCookies;
    cookies?: RequestCookies;
};
export declare type ResponseOutput = MaybeAsyncResponse;
export interface HttpPipelineOptions {
    basenames?: string[];
    body?: BodyOptions;
    cookie?: CookieOptions;
    query?: QueryOptions;
    contexts?: () => CellStorage;
}
export declare type HttpMiddleware = Middleware<RequestInfo, ResponseOutput>;
export declare const createHttpPipeline: (options?: HttpPipelineOptions | undefined) => {
    add: (...args: [path: string, middleware: Middleware<RequestInfo, MaybeAsyncResponse>] | [middleware: Middleware<RequestInfo, MaybeAsyncResponse>]) => void;
    route: (name: string, middleware: HttpMiddleware) => void;
    run: (input: RequestInfo, options?: import("../core/pipeline").RunPipelineOptions<RequestInfo, MaybeAsyncResponse> | undefined) => MaybeAsyncResponse;
    handle: (req: IncomingMessage, res: ServerResponse) => Promise<any>;
    listen: (handle: any, listeningListener?: (() => void) | undefined) => Server;
    middleware: Middleware<RequestInfo, MaybeAsyncResponse>;
};
export declare type HttpPipeline = ReturnType<typeof createHttpPipeline>;
export declare type ResponseParams = {
    requestInfo: RequestInfo;
    responseInfo: ResponseInfo;
    req: IncomingMessage;
    res: ServerResponse;
    context: Context;
};
export declare const handleResponse: (params: ResponseParams) => Promise<any>;
