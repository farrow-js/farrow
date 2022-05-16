# farrow-pipeline

Type-Friendly middleware library

## Installation

```shell
# via npm
npm install --save farrow-pipeline

# via yarn
yarn add farrow-pipeline
```

## API

```typescript
import {
  createContext, // create injectable context
  createContainer, // create context container
  createPipeline, // create pipeline
  usePipeline, // farrow-hooks for using pipeline in another pipeline's middleware
} from 'farrow-pipeline'
```

## createPipeline<I, O>(options?: PipelineOptions) => Pipeline<I, O>

create a pipeline

```typescript
// contexts for injecting to the pipeline
type PipelineOptions = {
  contexts?: ContextStorage
}

type Pipeline<I = unknown, O = unknown> = {
  // add middlewares to pipeline and return pipeline
  use: (...inputs: MiddlewareInput<I, O>[]) => Pipeline<I, O>
  // run a pipeline by input and received its output
  run: (input: I, options?: RunPipelineOptions<I, O>) => O
  // pipeline.middleware can use in another pipeline.use(...) if their type is matched
  middleware: Middleware<I, O>
}

type RunPipelineOptions<I = unknown, O = unknown> = {
  // container which store some contexts.if container is not given, pipeline will use its internal container
  container?: Container
  // if all middleware called next, then onLast would be called
  onLast?: (input: I) => O
}

const pipeline = createPipeline<number, number[]>()

pipeline.use((input, next) => {
  return [input, ...next(1), 3]
})

pipeline.use((input) => {
  return [input, 2]
})

let result = pipeline.run(0) // [0, 1, 2, 3]
```

## createContext<T>(defaultValue: T): Context<T>

create a injectable context

createContext is like `React.createContext`, we can use it injecting anything we want, and access `Context` in any middleware or custom-hooks function.

```typescript
type Context<T = any> = {
  id: symbol
  [ContextSymbol]: T
  // create a new context equipped a new value
  create: (value: T) => Context<T>
  // get context ref { value } for accessing context in current container of pipeline
  use: () => {
    value: T
  }
  // get context value
  get: () => T
  // set context value
  set: (value: T) => void
  // assert context value is not null or undefined and return context value
  assert: () => Exclude<T, undefined | null>
}

const Context0 = createContext(0)

const pipeline = createPipeline<number, number>({
  contexts: {
    // inject Context0 equipped 10 into pipeline
    context0: Context0.create(10),
  },
})

pipeline.use((input, next) => {
  return next(input) + Context0.get()
})

pipeline.use((input) => {
  Context0.set(Context0.get() + 1)
  return input
})

let result0 = pipeline.run(10) // return 21
let result1 = pipeline.run(20) // return 31
```

## createContainer(contexts?: ContextStorage): Container

create a container to manage contexts

```typescript
type ContextStorage = {
  [key: string]: Context
}

type Container = {
  // read current value of Context
  read: <V>(Context: Context<V>) => V
  // write current value of Context
  write: <V>(Context: Context<V>, value: V) => void
}

const Context0 = createContext(0)
const Context1 = createContext<number[]>([])

const container = createContainer({
  context0: Context0.create(10),
  context1: Context1.create([10]),
})

container.read(Context0) // 10
container.read(Context1) // [10]

container.write(Context0, 1)
container.write(Context1, [11])

container.read(Context0) // 1
container.read(Context1) // [11]

const pipeline = createPipeline<number, number>()

pipeline.run(10, {
  // use container to replace pipeline's internal container
  container: container,
})

// accessing value of Context0/Context1 after pipeline.run(...)
container.read(Context0) // current value of Context0
container.read(Context1) // current value of Context1
```
