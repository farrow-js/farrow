import { Middleware } from '../core/pipeline';
export declare const BasenamesCell: import("../core/pipeline").Cell<string[]>;
export declare const useBasenames: () => string[];
export declare const useBasenamesCell: () => {
    value: string[];
};
export declare const usePrefix: () => string;
export declare const route: <T extends {
    pathname: string;
}, U>(name: string, middleware: Middleware<T, U>) => Middleware<T, U>;
export declare const handleBasenames: <T extends {
    pathname: string;
}>(basenames: string[], requestInfo: T) => {
    basename: string;
    requestInfo: T & {
        pathname: string;
    };
};
