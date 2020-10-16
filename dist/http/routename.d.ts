import { Middleware } from '../core/pipeline';
export declare const RoutenameCell: import("../core/pipeline").Cell<string>;
export declare const useRoutenameCell: () => {
    value: string;
};
export declare const useRoutename: () => string;
export declare const route: <T extends {
    pathname: string;
}, U>(name: string, middleware: Middleware<T, U>) => Middleware<T, U>;
