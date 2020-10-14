import { Middleware } from '../core/pipeline';
import { ResponseOutput } from './index';
export declare const BasenameCell: import("../core/pipeline").Cell<string>;
export declare const useBasename: () => {
    value: string;
};
export declare const basename: <T extends {
    pathname: string;
}>(...basenames: string[]) => Middleware<T, import("./response").MaybeAsyncResponse>;
export declare const handleBasenames: <T extends {
    pathname: string;
}>(basenames: string[], request: T) => {
    basename: string;
    request: T & {
        pathname: string;
    };
};
