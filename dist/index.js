"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pipeline_1 = require("./core/pipeline");
const CountCell = pipeline_1.createContextCell(20);
const useCounter = pipeline_1.createHook(async function* () {
    let count = yield* pipeline_1.useCell(CountCell);
    let increBy = (step) => {
        count.value += step;
        return count;
    };
    return {
        count,
        increBy
    };
});
const delay = (duration) => {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
};
const log = (name) => {
    return pipeline_1.createMiddleware(async function* (next) {
        let start = Date.now();
        await next();
        let time = Date.now() - start;
        console.log(name, `time: ${time.toFixed(2)}ms`);
    });
};
const logCell = (name, Cell) => {
    return pipeline_1.createMiddleware(async function* (next) {
        let cell = yield* pipeline_1.useCell(Cell);
        let start = Date.now();
        let before = cell.value;
        await next();
        let time = Date.now() - start;
        let after = cell.value;
        console.log(name, {
            time,
            before,
            after
        });
    });
};
const TextCell = pipeline_1.createContextCell('');
const createTextPipeline = () => {
    let pipeline = pipeline_1.createPipeline();
    pipeline.use(logCell('text', TextCell));
    pipeline.use(async function* () {
        let text = yield* pipeline_1.useCell(TextCell);
        text.value = `some text`;
    });
    return pipeline;
};
const EnvCell = pipeline_1.createContextCell('fat');
const test = async () => {
    let pipeline = pipeline_1.createPipeline();
    pipeline.use(log('test'));
    pipeline.use(async function* (next) {
        let { count } = yield* useCounter();
        console.log('before', count.value);
        await next();
        console.log('after', count.value);
    });
    pipeline.use(async function* (next) {
        let env = yield* pipeline_1.useCell(EnvCell);
        if (env.value === 'fat') {
            let textPipeline = createTextPipeline();
            yield* pipeline_1.usePipeline(textPipeline, next);
        }
        else {
            await next();
        }
        let text = yield* pipeline_1.useCell(TextCell);
        console.log('text', text.value);
    });
    Array.from({ length: 1000 }).forEach(() => {
        pipeline.use(async function* (next) {
            yield* useCounter();
            yield* pipeline_1.useCell(EnvCell);
            await next();
        });
    });
    pipeline.use(async function* () {
        let counter = yield* useCounter();
        let env = yield* pipeline_1.useCell(EnvCell);
        await delay(500);
        console.log('env', { env: env.value });
        counter.increBy(10);
    });
    let manager = pipeline_1.createContextManager({
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
test();
