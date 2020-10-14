export declare type Json = number | string | boolean | null | object | Json[] | {
    [key: string]: Json;
};
export declare type Err<T = any> = {
    kind: 'Err';
    value: T;
    isErr: true;
    isOk: false;
};
export declare type Ok<T = any> = {
    kind: 'Ok';
    value: T;
    isErr: false;
    isOk: true;
};
export declare type Result<T = any, E = string> = Err<E> | Ok<T>;
export declare const Err: <E = string>(value: E) => Err<E>;
export declare const Ok: <T, E = string>(value: T) => Result<T, E>;
