import { Deferred, createDeferred } from './Deferred'
import { stringifyJson } from './stringifyJson'
type BatchInfo<Input, Options, Output> = {
  options: Options
  inputList: Input[]
  deferredList: Deferred<Output>[]
  map: Map<string, number>
}

/**
 *  @description
 * BatchProcessor is a tool to batch process data
 * 
 * The input with the same options will be batched together
 * 
 */
type BatchInfoMap<Input, Options, Output> = Map<string, BatchInfo<Input, Options, Output>>

const createBatchInfo = <Input, Options, Output>(options: Options): BatchInfo<Input, Options, Output> => {
  return {
    options,
    inputList: [],
    deferredList: [],
    map: new Map(),
  }
}

export type BatchProcessorOutputHandler<Output> = (output: Output | Promise<Output>, index: number) => void
export type BatchProcessorFlushHandler<Input, Options, Output> = (
  inputList: Input[],
  options: Options,
  onOutput: BatchProcessorOutputHandler<Output>,
) => void

export type BatchScheduler = (callback: () => void) => void

export type CreateBatchProcessorOptions<Input, Options, Output> = {
  cache?: boolean
  scheduler?: BatchScheduler
  onFlush: BatchProcessorFlushHandler<Input, Options, Output>
}

export type BatchAddOptions = {
  cache?: boolean
}

export const createBatchProcessor = <Input, Options, Output>(options: CreateBatchProcessorOptions<Input, Options, Output>) => {
  const shouldCache = options.cache ?? true
  let batchInfoMap: BatchInfoMap<Input, Options, Output> = new Map()

  const scheduleFlush = createScheduleFn(() => flush(), options.scheduler)

  const getBatchInfo = (options: Options) => {
    const key = stringifyJson(options)

    let batchInfo = batchInfoMap.get(key)

    if (!batchInfo) {
      batchInfo = createBatchInfo(options)
      batchInfoMap.set(key, batchInfo)
    }

    return batchInfo
  }

  const addDeferred = (input: Input, options: Options) => {
    const deferred = createDeferred<Output>()
    const batchInfo = getBatchInfo(options)

    batchInfo.inputList.push(input)
    batchInfo.deferredList.push(deferred)

    scheduleFlush()

    return deferred
  }

  const addWithoutCache = (input: Input, options: Options) => {
    const deferred = addDeferred(input, options)

    return deferred.promise
  }

  const addWithCache = (input: Input, options: Options) => {
    const cacheKey = stringifyJson(input)
    const batchInfo = getBatchInfo(options)

    const index = batchInfo.map.get(cacheKey)

    if (index !== undefined) {
      return batchInfo.deferredList[index].promise
    }

    const deferred = addDeferred(input, options)

    batchInfo.map.set(cacheKey, batchInfo.inputList.length - 1)

    return deferred.promise
  }

  const add = (input: Input, options: Options, batchOptions?: BatchAddOptions) => {
    if (shouldCache && batchOptions?.cache !== false) {
      return addWithCache(input, options)
    }

    return addWithoutCache(input, options)
  }

  const flushBatchInfo = (batchInfo: BatchInfo<Input, Options, Output>) => {
    const { inputList, options: batchOptions, deferredList } = batchInfo

    options.onFlush(inputList, batchOptions, (output, index) => {
      deferredList[index].resolve(output)
    })
  }

  const flush = () => {
    const currentBatchInfoMap = batchInfoMap

    batchInfoMap = new Map()

    for (const batchInfo of currentBatchInfoMap.values()) {
      flushBatchInfo(batchInfo)
    }
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
