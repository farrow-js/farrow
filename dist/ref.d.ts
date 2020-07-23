export declare const FARROW_REF: unique symbol;
export declare type Ref<T = any> = {
    [FARROW_REF]: symbol;
};
export declare const createRef: <T>(name?: string) => Ref<T>;
export declare type RefValueType<T extends Ref> = T extends Ref<infer V> ? V : never;
export declare type RefValue<T extends Ref> = {
    current: null | RefValueType<T>;
};
