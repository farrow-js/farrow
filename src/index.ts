import {
  createContextManager,
  createContextCell,
  createHook,
  createMiddleware,
  createPipeline,
  useCell,
  usePipeline,
  ContextCell
} from './core/pipeline'

const CountCell = createContextCell(20)

const useCounter = createHook(async function*() {
  let count = yield* useCell(CountCell)

  let increBy = (step: number) => {
    count.value += step
    return count
  }
  return {
    count,
    increBy
  }
})

const delay = (duration: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

const log = (name: string) => {
  return createMiddleware(async function*(next) {
    let start = Date.now()
    await next()
    let time = Date.now() - start
    console.log(name, `time: ${time.toFixed(2)}ms`)
  })
}

const logCell = (name: string, Cell: ContextCell) => {
  return createMiddleware(async function*(next) {
    let cell = yield* useCell(Cell)

    let start = Date.now()
    let before = cell.value

    await next()

    let time = Date.now() - start
    let after = cell.value

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
    let text = yield* useCell(TextCell)
    text.value = `some text`
  })

  return pipeline
}

type Env = 'fat' | 'uat' | 'prod'

const EnvCell = createContextCell<Env>('fat')

const test = async () => {
  let pipeline = createPipeline()

  pipeline.use(log('test'))

  pipeline.use(async function*(next) {
    let { count } = yield* useCounter()

    console.log('before', count.value)

    await next()

    console.log('after', count.value)
  })

  pipeline.use(async function*(next) {
    let env = yield* useCell(EnvCell)

    if (env.value === 'fat') {
      let textPipeline = createTextPipeline()
      yield* usePipeline(textPipeline, next)
    } else {
      await next()
    }

    let text = yield* useCell(TextCell)
    console.log('text', text.value)
  })

  Array.from({ length: 1000 }).forEach(() => {
    pipeline.use(async function*(next) {
      yield* useCounter()
      yield* useCell(EnvCell)
      await next()
    })
  })

  pipeline.use(async function*() {
    let counter = yield* useCounter()
    let env = yield* useCell(EnvCell)

    await delay(500)

    console.log('env', { env: env.value })

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

test()