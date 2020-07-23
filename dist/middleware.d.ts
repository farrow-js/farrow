export declare type Next = () => Promise<void>;
export declare type Middleware = (next: Next) => void;
export declare type Middlewares = Middleware[];
export declare const runMiddlewares: (middlewares: Middlewares, next: Next) => Promise<void>;
