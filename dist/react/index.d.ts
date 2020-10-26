import React from 'react';
import * as Http from '../http';
export declare type ReactRenderContext = {
    basenames: string[];
};
export declare const ReactRenderContext: React.Context<ReactRenderContext | null>;
export declare const useRenderContext: () => ReactRenderContext;
export declare const usePrefix: () => string;
export declare type ReactResponseOptions = {
    docType?: string;
};
export declare const defaultDocType = "<!doctype html>";
export declare const renderToString: <T extends JSX.Element>(element: T, options?: ReactResponseOptions | undefined) => Http.Response;
export declare const renderToNodeStream: <T extends JSX.Element>(element: T, options?: ReactResponseOptions | undefined) => Http.Response;
export declare type ReactViewOptions = ReactResponseOptions & {
    useStream?: boolean;
};
export declare const useReactView: (options?: ReactViewOptions | undefined) => {
    render: <T extends JSX.Element>(element: T) => Http.Response;
};
