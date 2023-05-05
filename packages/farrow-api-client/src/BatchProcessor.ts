import { Deferred, createDeferred } from './Deferred'
import { stringifyJson } from './stringifyJson'

type BatchInfo<Input, Output> = {
  inputList: Input[]
  deferredList: Deferred<Output>[]
  map: Map<string, number>
}

const createBatchInfo = <Input, Output>(): BatchInfo<Input, Output> => {
  return {
    inputList: [],
    deferredList: [],
    map: new Map(),
  }
}

export type BatchProcessorOutputHandler<Output> = (output: Output | Promise<Output>, index: number) => void
export type BatchProcessorFlushHandler<Input, Output> = (
  inputList: Input[],
  onOutput: BatchProcessorOutputHandler<Output>,
) => void

export type BatchScheduler = (callback: () => void) => void

export type CreateBatchProcessorOptions<Input, Output> = {
  cache?: boolean
  scheduler?: BatchScheduler
  onFlush: BatchProcessorFlushHandler<Input, Output>
}

export type BatchAddOptions = {
  cache?: boolean
}

export const createBatchProcessor = <Input, Output>(options: CreateBatchProcessorOptions<Input, Output>) => {
  const shouldCache = options.cache ?? true
  let batchInfo = createBatchInfo<Input, Output>()

  const scheduleFlush = createScheduleFn(() => flush(), options.scheduler)

  const addDeferred = (input: Input) => {
    const deferred = createDeferred<Output>()

    batchInfo.inputList.push(input)
    batchInfo.deferredList.push(deferred)

    scheduleFlush()

    return deferred
  }

  const addWithoutCache = (input: Input) => {
    const deferred = addDeferred(input)

    return deferred.promise
  }

  const addWithCache = (input: Input) => {
    const key = stringifyJson(input)

    if (batchInfo.map.has(key)) {
      const index = batchInfo.map.get(key)!
      return batchInfo.deferredList[index].promise
    }

    const deferred = addDeferred(input)

    batchInfo.map.set(key, batchInfo.inputList.length - 1)

    return deferred.promise
  }

  const add = (input: Input, options?: BatchAddOptions) => {
    if (shouldCache && options?.cache !== false) {
      return addWithCache(input)
    }

    return addWithoutCache(input)
  }

  const flush = () => {
    const { inputList, deferredList } = batchInfo

    batchInfo = createBatchInfo()

    options.onFlush(inputList, (output, index) => {
      deferredList[index].resolve(output)
    })
  }

  return {
    add,
  }
}

const createScheduleFn = (fn: () => void, scheduler?: BatchScheduler) => {
  if (scheduler) {
    const currentScheduler = scheduler
    let isScheduling = false
    return () => {
      if (isScheduling) {
        return
      }
      isScheduling = true
      let hasCalled = false
      currentScheduler(() => {
        if (hasCalled) {
          return
        }
        hasCalled = true
        isScheduling = false
        fn()
      })
    }
  }

  let promise: Promise<void> | null = null

  return () => {
    if (promise === null) {
      promise = Promise.resolve().then(() => {
        promise = null
        fn()
      })
    }
  }
}
