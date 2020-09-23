declare type JsonType = number | string | boolean | null | JsonType[] | {
    [key: string]: JsonType;
};
export declare type Type<T = any> = {
    (value: T): Term<T>;
    toJSON: () => JsonType;
    is: (term: Term) => term is Term<T>;
    assert: (term: Term) => asserts term is Term<T>;
    validate: (input: unknown) => Result<T>;
    pipe: <R>(options: CreateTypeOptions<R, T>) => Type<R>;
};
export declare type Term<T = any> = {
    kind: symbol;
    value: T;
};
export declare type RawType<T extends Type> = T extends Type<infer R> ? R : T;
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
export declare const Err: <T, E = string>(value: E) => Result<T, E>;
export declare const Ok: <T, E = string>(value: T) => Result<T, E>;
export declare type CreateTypeOptions<T, I = unknown> = {
    toJSON: () => JsonType;
    validate: (input: I) => Result<T>;
};
export declare const createType: <T>(options: CreateTypeOptions<T, unknown>) => Type<T>;
export declare const is: <T>(input: Term, Type: Type<T>) => input is Term<T>;
export declare const thunk: <T>(f: () => Type<T>) => Type<T>;
export declare const number: Type<number>;
export declare const string: Type<string>;
export declare const boolean: Type<boolean>;
export declare const list: <T extends Type<any>>(ItemType: T) => Type<RawType<T>[]>;
export declare type Fields = {
    [key: string]: Type;
};
export declare const object: <T extends Fields>(fields: T) => Type<{ [key in keyof T]: RawType<T[key]>; }>;
export declare const nullable: <T extends Type<any>>(Type: T) => Type<RawType<T> | null | undefined>;
declare type RawUnionItemType<T extends Type> = T extends Type ? RawType<T> : never;
export declare const union: <T extends Type<any>[]>(...Types: T) => Type<RawUnionItemType<T[number]>>;
export declare type LiteralType = string | number | boolean | null | undefined;
export declare const literal: <T extends LiteralType>(literal: T) => Type<T>;
export declare const record: <T extends Type<any>>(Type: T) => Type<Record<string, RawType<T>>>;
export declare type Object = Type<Record<string, any>>;
export declare type List = Type<any[]>;
export declare const Pattern: <T>(pattern: string, ParamsType: Type<T>) => Type<T>;
export {};
