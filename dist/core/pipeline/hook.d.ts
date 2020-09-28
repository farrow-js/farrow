declare type AnyFn = (...args: any) => any;
declare type Hooks = {
    [key: string]: AnyFn;
};
declare type DefaultHooks<HS extends Hooks> = {
    [key in keyof HS]: (...args: Parameters<HS[key]>) => never;
};
export declare const createHooks: <HS extends Hooks>(defaultHooks: DefaultHooks<HS>) => {
    run: <F extends AnyFn>(f: F, implementations: HS) => ReturnType<F>;
    hooks: HS;
};
export {};
