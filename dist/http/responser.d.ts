import * as Schema from '../core/schema';
export declare const json: Schema.Type<Schema.Json>;
export declare const JsonResponser: import(".").Responser<Schema.Json>;
export declare const text: Schema.Type<string>;
export declare const TextResponser: import(".").Responser<string>;
export declare const html: Schema.Type<string>;
export declare const HTMLResponser: import(".").Responser<string>;
export declare const status: Schema.Type<{
    code: number;
    message?: string | null | undefined;
}>;
export declare const StatusResponser: import(".").Responser<{
    code: number;
    message?: string | null | undefined;
}>;
