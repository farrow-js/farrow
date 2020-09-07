"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPipeline = exports.runHandler = exports.createContextManager = void 0;
const ContextCellSymbol = Symbol('ContextCell');
const createContextCell = (value) => {
    let id = Symbol('ContextID');
    let create = (value) => {
        return {
            id,
            [ContextCellSymbol]: value,
            create
        };
    };
    return create(value);
};
const toRawContextStorage = (ContextStorage) => {
    let result = {};
    for (let key in ContextStorage) {
        result[key] = ContextStorage[key][ContextCellSymbol];
    }
    return result;
};
const ContextManagerRequest = Symbol('context.manager.request');
const createCellMap = (storage) => {
    let cellMap = new Map();
    Object.values(storage).forEach(cell => {
        cellMap.set(cell.id, cell);
    });
    return cellMap;
};
exports.createContextManager = (ContextStorage = {}) => {
    let cellMap = createCellMap(ContextStorage);
    let read = (inputCell) => {
        let target = cellMap.get(inputCell.id);
        if (target) {
            return target[ContextCellSymbol];
        }
        return inputCell[ContextCellSymbol];
    };
    let write = (inputCell, value) => {
        cellMap.set(inputCell.id, inputCell.create(value));
    };
    let run = (gen) => {
        let next = (result) => {
            if (result.done) {
                return Promise.resolve(result.value);
            }
            if (result.value !== ContextManagerRequest) {
                throw new Error(`Please use yield* instead of yield`);
            }
            return gen.next(manager).then(next);
        };
        return gen.next(manager).then(next);
    };
    let manager = Object.freeze({
        read,
        write,
        run
    });
    return manager;
};
exports.runHandler = (handler) => {
    let latestIndex = -1;
    let dispatch = (index) => {
        if (index <= latestIndex) {
            throw new Error(`Called next() multiple times`);
        }
        latestIndex = index;
        try {
            return handler(dispatch.bind(null, index + 1), index);
        }
        catch (error) {
            return Promise.reject(error);
        }
    };
    return dispatch(0);
};
const createHook = (f) => {
    return f;
};
const createMiddleware = (f) => {
    return f;
};
exports.createPipeline = () => {
    let middlewares = [];
    let isRan = false;
    let use = (middleware) => {
        if (isRan) {
            throw new Error(`Can't add middleware after running`);
        }
        middlewares.push(middleware);
    };
    let run = (manager = exports.createContextManager()) => {
        isRan = true;
        return exports.runHandler((next, index) => {
            if (index >= middlewares.length) {
                return Promise.resolve();
            }
            else {
                let middleware = middlewares[index];
                let result = middleware(next, manager);
                if (result instanceof Promise) {
                    return result;
                }
                else {
                    return manager.run(result);
                }
            }
        });
    };
    return Object.freeze({
        use,
        run
    });
};
const usePipeline = createHook(async function* (pipeline) {
    let manager = yield* useManager();
    await pipeline.run(manager);
});
const useManager = createHook(async function* () {
    let manager = yield ContextManagerRequest;
    return manager;
});
const useCell = createHook(async function* (ContextCell) {
    let manager = yield* useManager();
    let getValue = () => {
        return manager.read(ContextCell);
    };
    let setValue = (value) => {
        manager.write(ContextCell, value);
    };
    return [getValue, setValue];
});
const useCellValue = createHook(async function* (ContextCell) {
    let [getValue] = yield* useCell(ContextCell);
    return getValue();
});
const CountCell = createContextCell(20);
const useCounter = createHook(async function* () {
    let [getCount, setCount] = yield* useCell(CountCell);
    let increBy = (step) => {
        let count = getCount();
        setCount(count + step);
        return count;
    };
    return {
        getCount,
        setCount,
        increBy
    };
});
const delay = (duration) => {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
};
const log = (name) => {
    return createMiddleware(async function (next) {
        let start = Date.now();
        await next();
        let time = Date.now() - start;
        console.log(name, `time: ${time.toFixed(2)}ms`);
    });
};
const logCell = (name, Cell) => {
    return createMiddleware(async function (next, ctx) {
        let [getValue] = await ctx.run(useCell(Cell));
        let start = Date.now();
        let before = getValue();
        await next();
        let time = Date.now() - start;
        let after = getValue();
        console.log(name, {
            time,
            before,
            after
        });
    });
};
const TextCell = createContextCell('');
const createTextPipeline = () => {
    let pipeline = exports.createPipeline();
    pipeline.use(logCell('text', TextCell));
    pipeline.use(async function* () {
        let [_, setText] = yield* useCell(TextCell);
        setText(`some text`);
    });
    return pipeline;
};
const EnvCell = createContextCell('fat');
const test = async () => {
    let pipeline = exports.createPipeline();
    pipeline.use(log('test'));
    pipeline.use(async function (next, ctx) {
        let counter = await ctx.run(useCounter());
        console.log('before', counter.getCount());
        await next();
        console.log('after', counter.getCount());
    });
    pipeline.use(async function* (next) {
        let env = yield* useCellValue(EnvCell);
        if (env === 'fat') {
            let textPipeline = createTextPipeline();
            yield* usePipeline(textPipeline);
        }
        else {
            await next();
        }
    });
    Array.from({ length: 1000 }).forEach(() => {
        pipeline.use(async function* (next) {
            yield* useCounter();
            yield* useCellValue(EnvCell);
            await next();
        });
    });
    pipeline.use(async function* () {
        let counter = yield* useCounter();
        let env = yield* useCellValue(EnvCell);
        await delay(500);
        console.log('env', { env });
        counter.increBy(10);
    });
    let manager = exports.createContextManager({
        count: CountCell.create(11),
        env: EnvCell.create('prod'),
        text: TextCell.create('initial text')
    });
    await pipeline.run(manager);
    let count = manager.read(CountCell);
    let env = manager.read(EnvCell);
    let text = manager.read(TextCell);
    console.log('values', {
        count,
        env,
        text
    });
};
// test()
