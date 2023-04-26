export const createDeferred = <T>() => {
    let resolve: (value: T | PromiseLike<T>) => void;

    let reject: (error: Error) => void;

    const promise = new Promise<T>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });

    return {
        promise,
        resolve: resolve!,
        reject: reject!,
    };
};

export type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (error: Error) => void;
}
