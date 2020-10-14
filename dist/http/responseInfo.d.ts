/// <reference types="node" />
import type { SetOption as CookieOptions } from 'cookies';
import type { IncomingMessage, ServerResponse } from 'http';
import Stream from 'stream';
import contentDisposition from 'content-disposition';
import { RequestInfo } from '.';
import { Json } from '../core/types';
export declare type Value = string | number;
export declare type Values = {
    [key: string]: Value;
};
export declare type Status = {
    code: number;
    message?: string;
};
export declare type Headers = {
    [key: string]: Value;
};
export declare type Cookies = {
    [key: string]: {
        value: Value | null;
        options?: CookieOptions;
    };
};
export declare type SharedResponseInfo = {
    status?: Status;
    headers?: Headers;
    cookies?: Cookies;
};
export declare type JsonBody = {
    type: 'json';
    value: Json;
};
export declare type TextBody = {
    type: 'text';
    value: string;
};
export declare type HtmlBody = {
    type: 'html';
    value: string;
};
export declare type EmptyBody = {
    type: 'empty';
    value: null;
};
export declare type RedirectBody = {
    type: 'redirect';
    useBasename: boolean;
    value: string;
};
export declare type StreamBody = {
    type: 'stream';
    value: Stream;
};
export declare type BufferBody = {
    type: 'buffer';
    value: Buffer;
};
export declare type RawBody = {
    type: 'raw';
    value: string;
};
export declare type FileBody = {
    type: 'file';
    value: string;
};
export declare type CustomBodyHandler = (arg: {
    req: IncomingMessage;
    res: ServerResponse;
    requestInfo: RequestInfo;
    responseInfo: Omit<ResponseInfo, 'body'>;
    basename: string;
}) => any;
export declare type CustomBody = {
    type: 'custom';
    handler: CustomBodyHandler;
};
export declare type Body = JsonBody | TextBody | HtmlBody | EmptyBody | RedirectBody | StreamBody | BufferBody | FileBody | RawBody | CustomBody;
export declare type BodyMap = {
    [V in Body as V['type']]: V;
};
export declare type ResponseInfo = {
    status?: Status;
    headers?: Headers;
    cookies?: Cookies;
    body?: Body;
    vary?: string[];
};
export declare const json: (value: Json) => ResponseInfo;
export declare const text: (value: string) => ResponseInfo;
export declare const html: (value: string) => ResponseInfo;
export declare const empty: () => ResponseInfo;
export declare const raw: (value: string) => ResponseInfo;
export declare const redirect: (url: string, useBasename?: boolean) => ResponseInfo;
export declare const custom: (handler: CustomBodyHandler) => ResponseInfo;
export declare const stream: (stream: Stream) => ResponseInfo;
export declare const buffer: (buffer: Buffer) => ResponseInfo;
export declare const file: (filename: string) => ResponseInfo;
export declare const attachment: (filename?: string | undefined, options?: contentDisposition.Options | undefined) => ResponseInfo;
export declare const status: (code: number, message?: string) => ResponseInfo;
export declare const headers: (headers: Headers) => ResponseInfo;
export declare const header: (name: string, value: Value) => ResponseInfo;
export declare const type: (type: string) => ResponseInfo;
export declare const cookies: (config: {
    [key: string]: string | number | null;
}, options?: CookieOptions | undefined) => ResponseInfo;
export declare const cookie: (name: string, value: Value | null, options?: CookieOptions | undefined) => ResponseInfo;
export declare const vary: (...fileds: string[]) => ResponseInfo;
export declare const merge: (...responses: ResponseInfo[]) => ResponseInfo;
