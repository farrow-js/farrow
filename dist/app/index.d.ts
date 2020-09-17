import { RequestInfo, ResponseInfo } from '../router';
import { ContextStorage } from '../core';
export declare type CreateAppOptions = {
    contexts?: ContextStorage;
};
export declare const createApp: <T extends CreateAppOptions>(options?: T | undefined) => {
    add: (input: import("../core").Middleware<RequestInfo, import("../core").ContextManagerGenerator<ResponseInfo>>) => void;
    run: (input: RequestInfo) => Promise<ResponseInfo>;
};
