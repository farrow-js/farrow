import { Json, Err, Ok, Result } from '../types';
export { Json, Err, Ok, Result };
export declare type SchemaError = {
    path?: (string | number)[];
    message: string;
};
declare const TypeSymbol: unique symbol;
export declare type Type<T = any> = {
    (value: T): Term<T>;
    [TypeSymbol]: true;
    toJSON: () => Json;
    is: (term: Term) => term is Term<T>;
    assert: (term: Term) => asserts term is Term<T>;
    validate: (input: unknown) => Result<T, SchemaError>;
};
export declare const isType: (input: any) => input is Type<any>;
declare const TermSymbol: unique symbol;
export declare type Term<T = any> = {
    [TermSymbol]: symbol;
    value: T;
};
export declare const isTerm: (input: any) => input is Term<any>;
export declare type RawType<T extends Type> = T extends Type<infer R> ? R : T;
export declare type CreateTypeOptions<T, I = unknown> = {
    toJSON?: () => Json;
    validate: (input: I) => Result<T, SchemaError>;
};
export declare const createType: <T>(options: CreateTypeOptions<T, unknown>) => Type<T>;
export declare const thunk: <T>(f: () => Type<T>) => Type<T>;
export declare const number: Type<number>;
export declare const string: Type<string>;
export declare const boolean: Type<boolean>;
export declare const list: <T extends Type<any>>(ItemType: T) => Type<RawType<T>[]>;
export declare type Fields = {
    [key: string]: Type;
};
export declare type RawFields<T extends Fields> = {
    [key in keyof T as undefined extends RawType<T[key]> ? never : key]: RawType<T[key]>;
} & {
    [key in keyof T as undefined extends RawType<T[key]> ? key : never]?: RawType<T[key]>;
};
export declare const object: <T extends Fields>(fields: T) => Type<{ [key in keyof RawFields<T>]: RawFields<T>[key]; }>;
export declare const nullable: <T extends Type<any>>(Type: T) => Type<RawType<T> | null | undefined>;
declare type RawUnionItemType<T extends Type> = T extends Type ? RawType<T> : never;
export declare const union: <T extends Type<any>[]>(...Types: T) => Type<RawUnionItemType<T[number]>>;
export declare type LiteralType = string | number | boolean | null | undefined;
export declare const literal: <T extends LiteralType>(literal: T) => Type<T>;
export declare const record: <T extends Type<any>>(Type: T) => Type<Record<string, RawType<T>>>;
export declare type ObjectSchema = Type<Record<string, any>>;
export declare type ListSchema = Type<any[]>;
export declare type JsonSchema = Type<Json>;
export declare const json: JsonSchema;
export declare const any: Type<any>;
export declare type TermSchema = Type<Term>;
export declare const term: TermSchema;
