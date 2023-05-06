import { createContext, createContainer, createPipeline, usePipeline, useContainer } from '../src'
import { createAsyncPipeline } from '../src/pipeline'
import * as asyncTracerImpl from '../src/asyncTracerImpl/node'

asyncTracerImpl.enable()

const delay = (duration: number = 1) => {
  return new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(true), duration)
  })
}

describe('createContext', () => {
  it('basic usage', () => {
    const Context0 = createContext({
      count: 0,
    })

    const Context1 = createContext({
      text: 'test',
    })

    const container = createContainer()

    expect(container.read(Context0)).toEqual({
      count: 0,
    })

    expect(container.read(Context1)).toEqual({
      text: 'test',
    })

    container.write(Context0, {
      count: 1,
    })

    expect(container.read(Context0)).toEqual({
      count: 1,
    })

    container.write(Context1, {
      text: 'update test',
    })

    expect(container.read(Context1)).toEqual({
      text: 'update test',
    })
  })

  it('inject new Context', () => {
    const Context0 = createContext({
      count: 0,
    })

    const Context1 = createContext({
      text: 'test',
    })

    const container = createContainer({
      count: Context0.create({
        count: 1,
      }),
      text: Context1.create({
        text: 'new text',
      }),
    })

    expect(container.read(Context0)).toEqual({
      count: 1,
    })

    expect(container.read(Context1)).toEqual({
      text: 'new text',
    })
  })
})

describe('createPipeline', () => {
  it('basic usage', async () => {
    type Input = {
      count: number
    }
    type Output = PromiseLike<number> | number

    const pipeline = createPipeline<Input, Output>()

    let list: number[] = []

    pipeline.use((input, next) => {
      list.push(1)
      return next()
    })

    pipeline.use((input, next) => {
      list.push(2)
      return next()
    })

    pipeline.use((input, next) => {
      list.push(3)
      return next()
    })

    pipeline.use((input, next) => {
      if (input.count < 10) {
        return input.count + 1
      }

      return next()
    })

    pipeline.use((input) => {
      list.push(4)
      return input.count + 2
    })

    const result0 = await pipeline.run({
      count: 0,
    })

    expect(result0).toEqual(1)
    expect(list).toEqual([1, 2, 3])

    list = []

    const result1 = await pipeline.run({
      count: 10,
    })

    expect(result1).toEqual(12)
    expect(list).toEqual([1, 2, 3, 4])
  })

  it('can change input and output', async () => {
    const pipeline = createPipeline<number, Promise<number>>()

    let list: number[] = []

    pipeline.use(async (input, next) => {
      list.push(input)
      const result = await next(input + 1)
      list.push(result)
      return result + 1
    })

    pipeline.use((input) => {
      list.push(input)
      return Promise.resolve(input + 1)
    })

    const result0 = await pipeline.run(0)

    expect(result0).toEqual(3)
    expect(list).toEqual([0, 1, 2])

    list = []

    const result1 = await pipeline.run(11)

    expect(result1).toEqual(14)
    expect(list).toEqual([11, 12, 13])
  })

  it('supports hooks in sync middleware', async () => {
    const Context0 = createContext(0)

    const pipeline = createPipeline<number, PromiseLike<number> | number>()

    const list: number[] = []

    pipeline.use((input, next) => {
      const value = Context0.get()

      list.push(value)

      Context0.set(value + 1)

      return next()
    })

    pipeline.use((input, next) => {
      const value = Context0.get()

      list.push(value)

      Context0.set(value + 2)

      return next()
    })

    pipeline.use((input) => {
      const value = Context0.get()
      list.push(value)
      return input + value
    })

    const result = await pipeline.run(10)

    expect(result).toEqual(13)
    expect(list).toEqual([0, 1, 3])
  })

  it('supports hooks in async middleware', async () => {
    const Context0 = createContext(0)

    const pipeline = createPipeline<number, Promise<number>>()

    const list: number[] = []

    pipeline.use(async (input, next) => {
      const value = Context0.get()

      list.push(value)

      Context0.set(value + 1)

      const result = await next()

      list.push(Context0.get())

      return result
    })

    pipeline.use(async (input, next) => {
      let value = Context0.get()

      list.push(value)

      Context0.set(value + 2)

      const result = await next()

      value = Context0.get()

      list.push(value)

      Context0.set(value + 3)

      return result
    })

    pipeline.use((input) => {
      const value = Context0.get()
      list.push(value)
      Context0.set(value + 1)
      return Promise.resolve(input + Context0.get())
    })

    const result = await pipeline.run(10)

    expect(result).toEqual(14)
    expect(list).toEqual([0, 1, 3, 4, 7])
  })

  it('can inject context', async () => {
    const TestContext = createContext(10)

    const pipeline = createPipeline<number, PromiseLike<number> | number>({
      contexts: {
        count: TestContext.create(100),
      },
    })

    pipeline.use((input) => {
      const value = TestContext.get()
      TestContext.set(value + input)
      return TestContext.get()
    })

    const result0 = await pipeline.run(20)

    expect(result0).toEqual(120)

    const container = createContainer({
      count: TestContext.create(10),
    })

    const result1 = await pipeline.run(30, {
      container,
    })

    expect(result1).toEqual(40)

    expect(container.read(TestContext)).toEqual(40)
  })

  it('should throw error if there are no middlewares in pipeline', async () => {
    const pipeline = createPipeline<number, PromiseLike<number> | number>()

    let error: Error | null = null

    try {
      await pipeline.run(1)
    } catch (e) {
      error = e as Error
    }

    expect(error === null).toBe(false)
  })

  it('should throw error if there are no middlewares returning value', async () => {
    const pipeline = createPipeline<number, PromiseLike<number> | number>()

    pipeline.use((input, next) => {
      return next()
    })

    pipeline.use((input, next) => {
      return next()
    })

    pipeline.use((input, next) => {
      return next()
    })

    pipeline.use((input, next) => {
      return next()
    })

    let error: Error | null = null

    try {
      await pipeline.run(1)
    } catch (e) {
      error = e as Error
    }

    expect(error === null).toBe(false)
  })

  it('should invoke onLast if there are no middlewares returned value', async () => {
    const pipeline = createPipeline<number, PromiseLike<number> | number>()

    const list: number[] = []

    pipeline.use((input, next) => {
      list.push(1)
      return next()
    })

    pipeline.use((input, next) => {
      list.push(2)
      return next()
    })

    pipeline.use((input, next) => {
      list.push(3)
      return next()
    })

    pipeline.use((input, next) => {
      list.push(4)
      return next()
    })

    const result = await pipeline.run(1, {
      onLast: (input) => input + 4,
    })

    expect(result).toEqual(5)
    expect(list).toEqual([1, 2, 3, 4])
  })

  it('can usePipeline in another pipeline', () => {
    const pipeline0 = createPipeline<string, string>()
    const pipeline1 = createPipeline<string, string>()

    pipeline0.use((input) => {
      return `${input} from pipeline0`
    })

    pipeline1.use((input) => {
      const runPipeline1 = usePipeline(pipeline0)

      const text = runPipeline1(' pipeline1')

      return input + text
    })

    const result = pipeline1.run('run')

    expect(result).toEqual(`run pipeline1 from pipeline0`)
  })

  it('can access current context in pipeline', () => {
    const Context0 = createContext(0)
    const Context1 = createContext(1)

    const pipeline = createPipeline<number, number>({
      contexts: {
        count0: Context0.create(10),
        count1: Context1.create(20),
      },
    })

    const list: boolean[] = []

    pipeline.use((input) => {
      const container = useContainer()
      const count0 = Context0.get()
      const count1 = Context1.get()

      list.push(container.read(Context0) === count0)
      list.push(container.read(Context1) === count1)

      return input
    })

    const result = pipeline.run(0)

    expect(result).toEqual(0)
    expect(list).toEqual([true, true])
  })

  it('should support multiple middlewares in pipeline.use', () => {
    const pipeline = createPipeline<number, number>()

    pipeline.use(
      (input, next) => {
        return next(input + 1)
      },
      (input, next) => {
        return next(input + 1)
      },
      (input, next) => {
        return next(input + 1)
      },
      (input, next) => {
        return next(input + 1)
      },
      (input) => {
        return input + 1
      },
    )

    const result = pipeline.run(0)

    expect(result).toBe(5)
  })

  it('should support the shape of { middleware } as arguments in pipeline.use', () => {
    const pipeline = createPipeline<number, number>()

    pipeline.use(
      {
        middleware: (input, next) => {
          return next(input + 1)
        },
      },
      {
        middleware: (input, next) => {
          return next(input + 1)
        },
      },
      {
        middleware: (input, next) => {
          return next(input + 1)
        },
      },
      {
        middleware: (input, next) => {
          return next(input + 1)
        },
      },
      (input) => {
        return input + 1
      },
    )

    const result = pipeline.run(0)

    expect(result).toBe(5)
  })

  it('should support pipeline.use(anotherPipeline) if their type is matched', () => {
    const StepContext = createContext(1)

    const pipeline0 = createPipeline<number, number>()

    const pipeline1 = createPipeline<number, number>()

    const steps = [] as number[]

    pipeline0.use((input, next) => {
      const step = StepContext.get()
      StepContext.set(step + 1)
      return next(input + step)
    })

    pipeline0.use(pipeline1)

    pipeline1.use((input) => {
      const step = StepContext.get()
      steps.push(step)
      return input + step
    })

    const result0 = pipeline1.run(0)
    const result1 = pipeline0.run(0)

    expect(result0).toEqual(1)
    expect(result1).toEqual(3)
    expect(steps).toEqual([1, 2])
  })

  it('support async pipeline', async () => {
    const pipeline = createAsyncPipeline<number, number>()

    pipeline.use((input, next) => {
      return next(input + 1)
    })

    let i = 0

    pipeline.useLazy(() => {
      const count = ++i
      return (input, next) => {
        return next(input + count)
      }
    })

    pipeline.useLazy(async () => {
      const count = await ++i
      return (input, next) => {
        return next(input + count)
      }
    })

    pipeline.use((input) => {
      return input
    })

    expect(i).toBe(0)

    const result0 = await pipeline.run(0)

    expect(result0).toBe(4)
    expect(i).toBe(2)

    const result1 = await pipeline.run(-4)

    expect(result1).toBe(0)
    expect(i).toBe(2)
  })

  it('support async tracer', async () => {
    const pipeline = createAsyncPipeline<number, number>()

    const Count = createContext({
      count: 10,
    })

    const incre = async () => {
      await delay()
      Count.set({
        count: Count.assert().count + 1,
      })
    }

    const list = [] as { count: number }[]

    pipeline.use(async (input, next) => {
      const before = Count.get()
      const result = await next(input)

      await incre()

      const after = Count.get()

      list.push(before, after)

      return result
    })

    pipeline.use(async (input) => {
      await delay()
      await incre()

      return input + Count.get().count
    })

    const container = createContainer({
      count: Count,
    })


    const result0 = await pipeline.run(10, {
      container,
    })

    expect(result0).toEqual(21)
    expect(list).toEqual([
      {
        count: 10,
      },
      {
        count: 12,
      },
    ])
  })

  it('onLast with context', async () => {
    const pipeline = createAsyncPipeline<void, number>()

    const CountContext = createContext(0)

    pipeline.use(async (_, next) => {
      CountContext.set(1)
      await delay(0)
      return next()
    })

    const result = await pipeline.run(void 0, {
      onLast: () => {
        return CountContext.get()
      },
    })

    expect(result).toBe(1)
  })
})
