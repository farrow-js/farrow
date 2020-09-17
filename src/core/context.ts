const ContextCellSymbol = Symbol('ContextCell')

export type ContextCell<T = any> = {
  id: symbol
  [ContextCellSymbol]: T
  create: (value: T) => ContextCell<T>
}

export const isContextCell = (input: any): input is ContextCell => {
  return !!input?.hasOwnProperty(ContextCellSymbol)
}

type AssertContextCell = (input: any) => asserts input is ContextCell

export const assertContextCell: AssertContextCell = input => {
  if (!isContextCell(input)) {
    throw new Error(`Expected ContextCell, but received ${input}`)
  }
}

export const createContextCell = <T>(value: T) => {
  let id = Symbol('ContextCellID')

  let create = (value: T): ContextCell<T> => {
    return {
      id,
      [ContextCellSymbol]: value,
      create
    }
  }

  return create(value)
}

export type ContextStorage = {
  [key: string]: ContextCell
}

export const ContextManagerRequestSymbol = Symbol('ContextManagerRequest')

type ContextManagerRequest = typeof ContextManagerRequestSymbol

export type ContextManagerGenerator<T extends any = void> = AsyncGenerator<
  ContextManagerRequest,
  T,
  ContextManager
>

export const ContextManagerSymbol = Symbol('ContextManager')

export type ContextManagerSymbol = typeof ContextManagerSymbol

export const isContextManager = (input: any): input is ContextManager => {
  return !!(input && input[ContextManagerSymbol])
}

type AssertContextManager = (input: any) => asserts input is ContextManager

export const assertContextManager: AssertContextManager = input => {
  if (!isContextManager(input)) {
    throw new Error(`Expected ContextManager, but received ${input}`)
  }
}

export type ContextManager = {
  [ContextManagerSymbol]: true
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

  let read: ContextManager['read'] = inputCell => {
    let target = cellMap.get(inputCell.id)
    if (target) {
      return target[ContextCellSymbol]
    }
    return inputCell[ContextCellSymbol]
  }

  let write: ContextManager['write'] = (inputCell, value) => {
    cellMap.set(inputCell.id, inputCell.create(value))
  }

  let run: ContextManager['run'] = <T = void>(gen: ContextManagerGenerator<T>): Promise<T> => {
    type Result = IteratorResult<ContextManagerRequest, T>

    let next = (result: Result): Promise<T> => {
      if (result.done) {
        return Promise.resolve(result.value)
      }

      if (result.value !== ContextManagerRequestSymbol) {
        throw new Error(`Please use yield* instead of yield`)
      }

      return gen.next(manager).then(next)
    }

    return gen.next(manager).then(next)
  }

  let manager: ContextManager = Object.freeze({
    [ContextManagerSymbol]: true,
    read,
    write,
    run
  })

  return manager
}
