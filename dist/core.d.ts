/// <reference types="node" />
import { Request, Response, RequestHandler } from 'express';
import { Path } from 'path-to-regexp';
import { URL } from 'url';
import { ContextItem, ContextValue, Context } from './context';
import { Ref, RefValue } from './ref';
import { Middlewares, Next } from './middleware';
export declare const useRequest: () => Request, useResponse: () => Response, useContext: <T extends Context<any>>(context: T) => ContextValue<T>, useRef: <T extends Ref<any>>(ref: T) => RefValue<T>, useMiddleware: (...middlewares: Middlewares) => void;
declare type CreateRequestListenerOptions = {
    context?: ContextItem;
};
export declare const createExpressMiddleware: (initializer: () => void, options?: CreateRequestListenerOptions) => RequestHandler;
export declare const useReq: () => Request;
export declare const useRes: () => Response;
export declare const useHeaders: () => import("http").IncomingHttpHeaders;
export declare const useUrl: () => URL;
export declare type MiddlewareWithParams<P extends object = object> = (params: P, next: Next) => Promise<void>;
export declare type MiddlewaresWithParams<P extends object = object> = MiddlewareWithParams<P>[];
export declare const useRoute: <T>(pattern: Result<T, string>, handler: (t: T, next: Next) => Promise<void>) => void;
declare type Err<T> = {
    kind: 'Err';
    value: T;
};
declare type Ok<T> = {
    kind: 'Ok';
    value: T;
};
export declare type Result<A, B> = Ok<A> | Err<B>;
export declare const Err: <B>(value: B) => Result<any, B>;
export declare const Ok: <A>(value: A) => Result<A, any>;
export declare function combine<A, T>(results: [Result<A, string>], f: (a: A) => T): Result<T, string>;
export declare function combine<A, B, T>(results: [Result<A, string>, Result<B, string>], f: (a: A, b: B) => T): Result<T, string>;
export declare function combine<A, B, C, T>(results: [Result<A, string>, Result<B, string>, Result<C, string>], f: (a: A, b: B, c: C) => T): Result<T, string>;
export declare function combine<A, B, C, D, T>(results: [Result<A, string>, Result<B, string>, Result<C, string>, Result<D, string>], f: (a: A, b: B, c: C, d: D) => T): Result<T, string>;
export declare function combine<A, B, C, D, E, T>(results: [Result<A, string>, Result<B, string>, Result<C, string>, Result<D, string>, Result<E, string>], f: (a: A, b: B, c: C, d: D, e: E) => T): Result<T, string>;
export declare function combine<A, B, C, D, E, F, T>(results: [Result<A, string>, Result<B, string>, Result<C, string>, Result<D, string>, Result<E, string>, Result<F, string>], f: (a: A, b: B, c: C, d: D, e: E, f: F) => T): Result<T, string>;
export declare function combine<A, B, C, D, E, F, G, T>(results: [Result<A, string>, Result<B, string>, Result<C, string>, Result<D, string>, Result<E, string>, Result<F, string>, Result<G, string>], f: (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => T): Result<T, string>;
export declare function combine<A, B, C, D, E, F, G, H, T>(results: [Result<A, string>, Result<B, string>, Result<C, string>, Result<D, string>, Result<E, string>, Result<F, string>, Result<G, string>, Result<H, string>], f: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H) => T): Result<T, string>;
export declare function combine<A, B, C, D, E, F, G, H, I, T>(results: [Result<A, string>, Result<B, string>, Result<C, string>, Result<D, string>, Result<E, string>, Result<F, string>, Result<G, string>, Result<H, string>, Result<I, string>], f: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I) => T): Result<T, string>;
export declare function combine<A, B, C, D, E, F, G, H, I, J, T>(results: [Result<A, string>, Result<B, string>, Result<C, string>, Result<D, string>, Result<E, string>, Result<F, string>, Result<G, string>, Result<H, string>, Result<I, string>, Result<J, string>], f: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J) => T): Result<T, string>;
declare type Extractor<T, TT = any> = (value: TT) => Result<T, string>;
export declare const useMatchQuery: <T>(f: Extractor<T, any>) => Result<T, string>;
export declare const useMatchBody: <T>(f: Extractor<T, any>) => Result<any, string>;
export declare const useMatchHeaders: <T>(f: Extractor<T, any>) => Result<T, string>;
export declare const useMatchPath: <T>(path: Path, f: Extractor<T, any>) => Result<T, string>;
export {};
