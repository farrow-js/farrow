import { Middleware } from '../core/pipeline';
import { ResponseOutput } from './index';
export declare const DirnameCell: import("../core/pipeline").Cell<string>;
export declare const useDirname: () => {
    value: string;
};
export declare const dirname: (input: string) => Middleware<any, ResponseOutput>;
