import { Middleware } from '../core/pipeline';
import { ResponseOutput } from './index';
export declare const BasenameCell: import("../core/pipeline").Cell<string>;
export declare const useBasename: () => {
    value: string;
};
export declare const basename: <T extends {
    pathname: string;
}>(...basenames: string[]) => Middleware<T, import("./response").MaybeAsyncResponse>;
