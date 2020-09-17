import { RequestInfo } from '../router';
import { ContextStorage } from '../core';
export declare type CreateAppOptions = {
    contexts?: ContextStorage;
};
export declare const createApp: <T extends CreateAppOptions>(options?: T | undefined) => {
    add: any;
    run: (input: RequestInfo) => any;
};
