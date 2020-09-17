import { createHooks } from './hook'

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

export const assertContextCell: AssertContextCell = (input) => {
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
      create,
    }
  }

  return create(value)
}

export type ContextStorage = {
  [key: string]: ContextCell
}

export const ContextManagerSymbol = Symbol('ContextManager')

export type ContextManagerSymbol = typeof ContextManagerSymbol

export const isContextManager = (input: any): input is ContextManager => {
  return !!(input && input[ContextManagerSymbol])
}

type AssertContextManager = (input: any) => asserts input is ContextManager

export const assertContextManager: AssertContextManager = (input) => {
  if (!isContextManager(input)) {
    throw new Error(`Expected ContextManager, but received ${input}`)
  }
}

export type ContextManager = {
  [ContextManagerSymbol]: true
  read: <V>(ContextCell: ContextCell<V>) => V
  write: <V>(ContextCell: ContextCell<V>, value: V) => void
}

const createCellMap = (storage: ContextStorage) => {
  let cellMap = new Map<symbol, ContextCell>()

  Object.values(storage).forEach((cell) => {
    cellMap.set(cell.id, cell)
  })

  return cellMap
}

export const createContextManager = (ContextStorage: ContextStorage = {}): ContextManager => {
  let cellMap = createCellMap(ContextStorage)

  let read: ContextManager['read'] = (inputCell) => {
    let target = cellMap.get(inputCell.id)
    if (target) {
      return target[ContextCellSymbol]
    }
    return inputCell[ContextCellSymbol]
  }

  let write: ContextManager['write'] = (inputCell, value) => {
    cellMap.set(inputCell.id, inputCell.create(value))
  }

  let manager: ContextManager = Object.freeze({
    [ContextManagerSymbol]: true,
    read,
    write,
  })

  return manager
}

export type Hooks = {
  useManager: () => ContextManager
  useCell: <T>(Cell: ContextCell<T>) => { value: T }
  useCellValue: <T>(Cell: ContextCell<T>) => T
}

const { run, hooks } = createHooks<Hooks>({
  useManager: () => {
    throw new Error(
      `Can't call useManager out of scope, it should be placed on top of the function`
    )
  },
  useCell: () => {
    throw new Error(`Can't call useCell out of scope, it should be placed on top of the function`)
  },
  useCellValue: () => {
    throw new Error(
      `Can't call useCellValue out of scope, it should be placed on top of the function`
    )
  },
})

export const runContextHooks = run

export const { useManager, useCell, useCellValue } = hooks

export const fromManager = (manager: ContextManager): Hooks => ({
  useManager: () => {
    return manager
  },
  useCell: (Cell) => {
    return Object.seal({
      get value() {
        return manager.read(Cell)
      },
      set value(v) {
        manager.write(Cell, v)
      },
    })
  },
  useCellValue: (Cell) => {
    return manager.read(Cell)
  },
})
