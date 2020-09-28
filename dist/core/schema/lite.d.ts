declare type LiteNullable = {
    __kind: 'nullable';
    type: LiteSchema;
};
declare type LiteUnion = {
    __kind: 'union';
    types: LiteSchema[];
};
declare type LiteObject = {
    [key: string]: LiteSchema;
};
declare type LiteList = [LiteSchema];
declare type LiteTuple = LiteSchema[];
export declare type LiteSchema = NumberConstructor | StringConstructor | BooleanConstructor | LiteList | LiteNullable | LiteUnion | LiteObject | LiteTuple | number | string | boolean | null;
declare type RawLiteUnion<T extends LiteUnion> = T extends LiteUnion ? RawLiteSchema<T['types'][number]> : never;
export declare type RawLiteSchema<T> = T extends NumberConstructor ? number : T extends StringConstructor ? string : T extends BooleanConstructor ? boolean : T extends LiteList ? RawLiteSchema<T[0]>[] : T extends LiteNullable ? RawLiteSchema<T['type']> | null | undefined : T extends LiteUnion ? RawLiteUnion<T> : T extends LiteObject | LiteTuple ? {
    [key in keyof T]: RawLiteSchema<T[key]>;
} : T extends string | number | boolean | null ? T : never;
export declare function fromLiteSchema<T extends LiteSchema>(schema: T): RawLiteSchema<T>;
export {};
