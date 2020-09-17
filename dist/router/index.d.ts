/// <reference types="node" />
import type { Stream } from 'stream';
import * as Schema from '../schema';
export declare type RouterOptions<T extends Schema.MaybeNullable = Schema.MaybeNullable> = {
    pathname: string;
    data?: T;
    onValidationError?: (error: Schema.ValidationError) => boolean | void;
};
export declare type RouterSchema<T extends RouterOptions> = {
    [key in keyof Omit<T, 'pathname'>]: Omit<T, 'pathname'>[key];
};
export declare type RequestInfo = {
    pathname: string;
    method?: string;
    body?: Record<string, any>;
    query?: Record<string, any>;
    cookies?: Record<string, any>;
    headers?: Record<string, any>;
};
export declare type ResponseHeadersInfo = {
    [header: string]: number | string | string[] | undefined;
};
export declare type ResponseInfo = {
    status: number;
    statusText: string;
    headers?: ResponseHeadersInfo;
    body?: Buffer | Stream | string | number | boolean | object | null;
};
export declare const createRouterPipeline: <T extends RouterOptions<Schema.MaybeNullable>>(options: T) => {
    middleware: any;
    add: any;
};
