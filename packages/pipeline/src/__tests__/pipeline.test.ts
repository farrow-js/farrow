import { createCell, createContext, createPipeline, usePipeline, useContext } from '../'

describe('createContext', () => {
  it('basic usage', () => {
    let Cell0 = createCell({
      count: 0,
    })

    let Cell1 = createCell({
      text: 'test',
    })

    let ctx = createContext()

    expect(ctx.read(Cell0)).toEqual({
      count: 0,
    })

    expect(ctx.read(Cell1)).toEqual({
      text: 'test',
    })

    ctx.write(Cell0, {
      count: 1,
    })

    expect(ctx.read(Cell0)).toEqual({
      count: 1,
    })

    ctx.write(Cell1, {
      text: 'update test',
    })

    expect(ctx.read(Cell1)).toEqual({
      text: 'update test',
    })
  })

  it('inject new cell', () => {
    let Cell0 = createCell({
      count: 0,
    })

    let Cell1 = createCell({
      text: 'test',
    })

    let ctx = createContext({
      count: Cell0.create({
        count: 1,
      }),
      text: Cell1.create({
        text: 'new text',
      }),
    })

    expect(ctx.read(Cell0)).toEqual({
      count: 1,
    })

    expect(ctx.read(Cell1)).toEqual({
      text: 'new text',
    })
  })
})

describe('createPipeline', () => {
  it('basic usage', async () => {
    type Input = {
      count: number
    }
    type Output = number

    let pipeline = createPipeline<Input, Output>()

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
      } else {
        return next()
      }
    })

    pipeline.use((input) => {
      list.push(4)
      return input.count + 2
    })

    let result0 = await pipeline.run({
      count: 0,
    })

    expect(result0).toEqual(1)
    expect(list).toEqual([1, 2, 3])

    list = []

    let result1 = await pipeline.run({
      count: 10,
    })

    expect(result1).toEqual(12)
    expect(list).toEqual([1, 2, 3, 4])
  })

  it('can change input and output', async () => {
    let pipeline = createPipeline<number, Promise<number>>()

    let list: number[] = []

    pipeline.use(async (input, next) => {
      list.push(input)
      let result = await next(input + 1)
      list.push(result)
      return result + 1
    })

    pipeline.use(async (input) => {
      list.push(input)
      return input + 1
    })

    let result0 = await pipeline.run(0)

    expect(result0).toEqual(3)
    expect(list).toEqual([0, 1, 2])

    list = []

    let result1 = await pipeline.run(11)

    expect(result1).toEqual(14)
    expect(list).toEqual([11, 12, 13])
  })

  it('supports hooks in sync middleware', async () => {
    let Cell0 = createCell(0)

    let pipeline = createPipeline<number, number>()

    let list: number[] = []

    pipeline.use((input, next) => {
      let cell = Cell0.useCell()

      list.push(cell.value)

      cell.value += 1

      return next()
    })

    pipeline.use((input, next) => {
      let cell = Cell0.useCell()

      list.push(cell.value)

      cell.value += 2

      return next()
    })

    pipeline.use((input) => {
      let cell = Cell0.useCell()
      list.push(cell.value)
      return input + cell.value
    })

    let result = await pipeline.run(10)

    expect(result).toEqual(13)
    expect(list).toEqual([0, 1, 3])
  })

  it('supports hooks in async middleware', async () => {
    let Cell0 = createCell(0)

    let pipeline = createPipeline<number, Promise<number>>()

    let list: number[] = []

    pipeline.use(async (input, next) => {
      let cell = Cell0.useCell()

      list.push(cell.value)

      cell.value += 1

      let result = await next()

      list.push(cell.value)

      return result
    })

    pipeline.use(async (input, next) => {
      let cell = Cell0.useCell()

      list.push(cell.value)

      cell.value += 2

      let result = await next()

      list.push(cell.value)

      cell.value += 3

      return result
    })

    pipeline.use(async (input) => {
      let cell = Cell0.useCell()
      list.push(cell.value)
      cell.value += 1
      return input + cell.value
    })

    let result = await pipeline.run(10)

    expect(result).toEqual(14)
    expect(list).toEqual([0, 1, 3, 4, 7])
  })

  it('can inject context', async () => {
    let Cell = createCell(10)
    let pipeline = createPipeline<number, number>({
      contexts: {
        count: Cell.create(100),
      },
    })

    pipeline.use((input) => {
      let cell = Cell.useCell()
      cell.value += input
      return cell.value
    })

    let result0 = await pipeline.run(20)

    expect(result0).toEqual(120)

    let ctx = createContext({
      count: Cell.create(10),
    })

    let rseult1 = await pipeline.run(30, {
      context: ctx,
    })

    expect(rseult1).toEqual(40)

    expect(ctx.read(Cell)).toEqual(40)
  })

  it('should throw error if there are no middlewares in pipeline', async () => {
    let pipeline = createPipeline<number, number>()

    let error: Error | null = null

    try {
      await pipeline.run(1)
    } catch (e) {
      error = e
    }

    expect(error === null).toBe(false)
  })

  it('should throw error if there are no middlewares returning value', async () => {
    let pipeline = createPipeline<number, number>()

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
      error = e
    }

    expect(error === null).toBe(false)
  })

  it('should invoke onLast if there are no middlewares returned value', async () => {
    let pipeline = createPipeline<number, number>()

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
      list.push(4)
      return next()
    })

    let result = await pipeline.run(1, {
      onLast: (input) => input + 4,
    })

    expect(result).toEqual(5)
    expect(list).toEqual([1, 2, 3, 4])
  })

  it('can usePipeline in another pipeline', async () => {
    let pipeline0 = createPipeline<string, string>()
    let pipeline1 = createPipeline<string, string>()

    pipeline0.use((input) => {
      return input + ' from pipeline0'
    })

    pipeline1.use((input) => {
      let runPipeline1 = usePipeline(pipeline0)

      let text = runPipeline1(' pipeline1')

      return input + text
    })

    let result = pipeline1.run('run')

    expect(result).toEqual(`run pipeline1 from pipeline0`)
  })

  it('can access current context in pipeline', async () => {
    let Cell0 = createCell(0)
    let Cell1 = createCell(1)

    let pipeline = createPipeline<number, number>({
      contexts: {
        count0: Cell0.create(10),
        count1: Cell1.create(20),
      },
    })

    let list: boolean[] = []

    pipeline.use((input) => {
      let ctx = useContext()
      let count0 = Cell0.useCell().value
      let count1 = Cell1.useCell().value

      list.push(ctx.read(Cell0) === count0)
      list.push(ctx.read(Cell1) === count1)

      return input
    })

    let result = pipeline.run(0)

    expect(result).toEqual(0)
    expect(list).toEqual([true, true])
  })

  it('should support multiple middlewares in pipeline.use', async () => {
    let pipeline = createPipeline<number, number>()

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

    let result = pipeline.run(0)

    expect(result).toBe(5)
  })

  it('should support the shape of { middleware } as arguments in pipeline.use', async () => {
    let pipeline = createPipeline<number, number>()

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

    let result = pipeline.run(0)

    expect(result).toBe(5)
  })

  it('should support pipeline.use(anotherPipeline) if their type is matched', async () => {
    let pipeline0 = createPipeline<number, number>()

    let pipeline1 = createPipeline<number, number>()

    pipeline0.use((input, next) => {
      return next(input + 1)
    })

    pipeline0.use(pipeline1)

    pipeline1.use((input) => {
      return input + 1
    })

    let result0 = pipeline1.run(0)
    let result1 = pipeline0.run(0)

    expect(result0).toEqual(1)
    expect(result1).toEqual(2)
  })
})
