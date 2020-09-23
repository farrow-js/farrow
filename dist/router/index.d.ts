import { Middleware, Next, PipelineOptions } from '../core';
import * as Schema from '../schema/type';
export interface RouterPipelineOptions<I, O> extends PipelineOptions<O> {
    input: Schema.Type<I>;
    output: Schema.Type<O>;
    onValidationFailed?: (message: string) => void;
}
export declare const createRouterPipeline: <I, O>(options: RouterPipelineOptions<I, O>) => {
    middleware: <T>(input: T, next: Next<T, O>) => O;
    add: (input: Middleware<I, O>) => void;
};
