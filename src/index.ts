const ContextCellSymbol = Symbol('ContextCell')

type ContextCell<T = any> = {
  id: symbol
  [ContextCellSymbol]: T
  create: (value: T) => ContextCell<T>
}

const createContextCell = <T>(value: T) => {
  let id = Symbol('ContextID')
  let create = (value: T): ContextCell<T> => {
    return {
      id,
      [ContextCellSymbol]: value,
      create
    }
  }
  return create(value)
}

type ContextCellValue<S extends ContextCell> = S extends ContextCell<infer V> ? V : never

type ContextStorage = {
  [key: string]: ContextCell
}

type RawContextStorage<T extends ContextStorage> = {
  [key in keyof T]: ContextCellValue<T[key]>
}

const toRawContextStorage = <T extends ContextStorage>(
  ContextStorage: T
): {
  [key in keyof T]: ContextCellValue<T[key]>
} => {
  let result = {} as RawContextStorage<T>

  for (let key in ContextStorage) {
    result[key] = ContextStorage[key][ContextCellSymbol]
  }

  return result
}

const ContextManagerRequest = Symbol('context.manager.request')

type ContextManagerRequest = typeof ContextManagerRequest

export type ContextManagerGenerator<T extends any = void> = AsyncGenerator<
  ContextManagerRequest,
  T,
  ContextManager
>

export type ContextManager = {
  read: <V>(ContextCell: ContextCell<V>) => V
  write: <V>(ContextCell: ContextCell<V>, value: V) => void
  run: <T = void>(gen: ContextManagerGenerator<T>) => Promise<T>
}

const createCellMap = (storage: ContextStorage) => {
  let cellMap = new Map<symbol, ContextCell>()

  Object.values(storage).forEach(cell => {
    cellMap.set(cell.id, cell)
  })

  return cellMap
}

export const createContextManager = (ContextStorage: ContextStorage = {}): ContextManager => {
  let cellMap = createCellMap(ContextStorage)

  let read = <T>(inputCell: ContextCell<T>): T => {
    let target = cellMap.get(inputCell.id)
    if (target) {
      return target[ContextCellSymbol]
    }
    return inputCell[ContextCellSymbol]
  }

  let write = <T>(inputCell: ContextCell<T>, value: T) => {
    cellMap.set(inputCell.id, inputCell.create(value))
  }

  let run = <T = void>(gen: ContextManagerGenerator<T>): Promise<T> => {
    type Result = IteratorResult<ContextManagerRequest, T>

    let next = (result: Result): Promise<T> => {
      if (result.done) {
        return Promise.resolve(result.value)
      }

      if (result.value !== ContextManagerRequest) {
        throw new Error(`Please use yield* instead of yield`)
      }

      return gen.next(manager).then(next)
    }

    return gen.next(manager).then(next)
  }

  let manager: ContextManager = Object.freeze({
    read,
    write,
    run
  })

  return manager
}

export type Next = () => Promise<void>

export type Middleware =
  | ((next: Next, ctx: ContextManager) => ContextManagerGenerator<void>)
  | ((next: Next, ctx: ContextManager) => Promise<void>)

export type Middlewares = Middleware[]

type Handler = (next: Next, index: number) => Promise<void>

export const runHandler = (handler: Handler) => {
  let latestIndex = -1

  let dispatch = (index: number): Promise<void> => {
    if (index <= latestIndex) {
      throw new Error(`Called next() multiple times`)
    }

    latestIndex = index
    try {
      return handler(dispatch.bind(null, index + 1), index)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return dispatch(0)
}

type HookFunction<Args extends any[] = any, T = any> = (...args: Args) => ContextManagerGenerator<T>

const createHook = <Args extends any[], T>(
  f: HookFunction<Args, T>
): ((...args: Args) => ContextManagerGenerator<T>) => {
  return f
}

const createMiddleware = <T extends Middleware>(f: T): Middleware => {
  return f
}

export const createPipeline = () => {
  let middlewares: Middlewares = []

  let isRan = false

  let use = (middleware: Middleware) => {
    if (isRan) {
      throw new Error(`Can't add middleware after running`)
    }
    middlewares.push(middleware)
  }

  let run = (manager: ContextManager = createContextManager()) => {
    isRan = true
    return runHandler((next, index) => {
      if (index >= middlewares.length) {
        return Promise.resolve()
      } else {
        let middleware = middlewares[index]
        let result = middleware(next, manager)
        if (result instanceof Promise) {
          return result
        } else {
          return manager.run(result)
        }
      }
    })
  }

  return Object.freeze({
    use,
    run
  })
}

type Pipeline = ReturnType<typeof createPipeline>

const usePipeline = createHook(async function*(pipeline: Pipeline) {
  let manager = yield* useManager()
  await pipeline.run(manager)
})

const useManager = createHook(async function*() {
  let manager = yield ContextManagerRequest
  return manager
})

const useCell = createHook(async function*<T>(ContextCell: ContextCell<T>) {
  let manager = yield* useManager()

  let getValue = () => {
    return manager.read(ContextCell)
  }

  let setValue = (value: T) => {
    manager.write(ContextCell, value)
  }

  return [getValue, setValue] as const
})

const useCellValue = createHook(async function*<T>(ContextCell: ContextCell<T>) {
  let [getValue] = yield* useCell(ContextCell)
  return getValue()
})

const CountCell = createContextCell(20)

const useCounter = createHook(async function*() {
  let [getCount, setCount] = yield* useCell(CountCell)

  let increBy = (step: number) => {
    let count = getCount()
    setCount(count + step)
    return count
  }

  return {
    getCount,
    setCount,
    increBy
  }
})

const delay = (duration: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

const log = (name: string) => {
  return createMiddleware(async function(next) {
    let start = Date.now()
    await next()
    let time = Date.now() - start
    console.log(name, `time: ${time.toFixed(2)}ms`)
  })
}

const logCell = (name: string, Cell: ContextCell) => {
  return createMiddleware(async function(next, ctx) {
    let [getValue] = await ctx.run(useCell(Cell))

    let start = Date.now()
    let before = getValue()

    await next()
    let time = Date.now() - start
    let after = getValue()
    console.log(name, {
      time,
      before,
      after
    })
  })
}

const TextCell = createContextCell('')

const createTextPipeline = () => {
  let pipeline = createPipeline()

  pipeline.use(logCell('text', TextCell))

  pipeline.use(async function*() {
    let [_, setText] = yield* useCell(TextCell)

    setText(`some text`)
  })

  return pipeline
}

type Env = 'fat' | 'uat' | 'prod'

const EnvCell = createContextCell<Env>('fat')

const test = async () => {
  let pipeline = createPipeline()

  pipeline.use(log('test'))

  pipeline.use(async function(next, ctx) {
    let counter = await ctx.run(useCounter())

    console.log('before', counter.getCount())

    await next()

    console.log('after', counter.getCount())
  })

  pipeline.use(async function*(next) {
    let env = yield* useCellValue(EnvCell)

    if (env === 'fat') {
      let textPipeline = createTextPipeline()
      yield* usePipeline(textPipeline)
    } else {
      await next()
    }
  })

  Array.from({ length: 1000 }).forEach(() => {
    pipeline.use(async function*(next) {
      yield* useCounter()
      yield* useCellValue(EnvCell)
      await next()
    })
  })

  pipeline.use(async function*() {
    let counter = yield* useCounter()
    let env = yield* useCellValue(EnvCell)

    await delay(500)

    console.log('env', { env })

    counter.increBy(10)
  })

  let manager = createContextManager({
    count: CountCell.create(11),
    env: EnvCell.create('prod'),
    text: TextCell.create('initial text')
  })

  await pipeline.run(manager)

  let count = manager.read(CountCell)
  let env = manager.read(EnvCell)
  let text = manager.read(TextCell)

  console.log('values', {
    count,
    env,
    text
  })
}

// test()
