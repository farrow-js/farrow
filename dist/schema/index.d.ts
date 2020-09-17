export declare type Number = {
    kind: 'Number';
};
export declare const Number: Number;
export declare type String = {
    kind: 'String';
};
export declare const String: String;
export declare type Boolean = {
    kind: 'Boolean';
};
export declare const Boolean: Boolean;
export declare type Nullable<T extends Data = any> = {
    kind: 'Nullable';
    type: T;
};
export declare const Nullable: <T extends Data>(type: T) => Nullable<T>;
declare type KindableData = String | Number | Boolean | List | Union;
declare type LiteralData = string | number | boolean;
declare type Data = KindableData | LiteralData | Object;
export declare type MaybeNullable = Data | Nullable;
export declare type List<T extends Data = any> = {
    kind: 'List';
    type: T;
};
export declare const List: <T extends Data>(type: T) => List<T>;
export declare type Object = {
    [key: string]: MaybeNullable;
};
export declare type Union<T extends MaybeNullable[] = any> = {
    kind: 'Union';
    types: T;
};
export declare const Union: <T extends MaybeNullable[]>(...types: T) => Union<T>;
export declare type Optional<T> = T | null | undefined;
declare type RawListType<T extends List> = T extends List<infer Item> ? Array<RawType<Item>> : never;
declare type RawUnionItemType<T> = T extends any ? RawType<T> : never;
declare type RawUnionType<T extends Union> = T extends Union<infer Types> ? RawUnionItemType<Types[number]> : never;
export declare type RawType<T> = T extends Number ? number : T extends String ? string : T extends Boolean ? boolean : T extends List ? RawListType<T> : T extends Object ? {
    [key in keyof T]: T[key] extends Nullable<infer V> ? Optional<RawType<V>> : RawType<T[key]>;
} : T extends Union ? RawUnionType<T> : T;
export declare type ValidationError = {
    kind: 'Err';
    schema: MaybeNullable;
    path: string[];
    input: any;
    message: string;
};
export declare type ValidationValue<T extends MaybeNullable> = {
    kind: 'Ok';
    value: RawType<T>;
};
export declare type ValidationResult<T extends MaybeNullable> = ValidationError | ValidationValue<T>;
export declare const verify: <T extends MaybeNullable>(schema: T, input: any, path?: string[]) => ValidationResult<T>;
export {};
