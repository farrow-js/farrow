import { createHooks } from './hook'

const CellSymbol = Symbol('Cell')

export type Cell<T = any> = {
  id: symbol
  [CellSymbol]: T
  create: (value: T) => Cell<T>
  useCell: () => {
    value: T
  }
}

export const isCell = (input: any): input is Cell => {
  return !!input?.hasOwnProperty(CellSymbol)
}

type AssertCell = (input: any) => asserts input is Cell

export const assertCell: AssertCell = (input) => {
  if (!isCell(input)) {
    throw new Error(`Expected Cell, but received ${input}`)
  }
}

export const createCell = <T>(value: T) => {
  let id = Symbol('CellID')

  let create = (value: T): Cell<T> => {
    let useCell = () => {
      let ctx = useContext()
      return Object.seal({
        get value() {
          return ctx.read(Cell)
        },
        set value(v) {
          ctx.write(Cell, v)
        },
      })
    }
    let Cell: Cell<T> = {
      id,
      [CellSymbol]: value,
      create,
      useCell,
    }
    return Cell
  }

  return create(value)
}

export type CellStorage = {
  [key: string]: Cell
}

export const ContextSymbol = Symbol('Context')

export type ContextSymbol = typeof ContextSymbol

export const isContext = (input: any): input is Context => {
  return !!(input && input[ContextSymbol])
}

type AssertContext = (input: any) => asserts input is Context

export const assertContext: AssertContext = (input) => {
  if (!isContext(input)) {
    throw new Error(`Expected Context, but received ${input}`)
  }
}

export type Context = {
  [ContextSymbol]: true
  read: <V>(Cell: Cell<V>) => V
  write: <V>(Cell: Cell<V>, value: V) => void
}

const createCellMap = (storage: CellStorage) => {
  let cellMap = new Map<symbol, Cell>()

  Object.values(storage).forEach((cell) => {
    cellMap.set(cell.id, cell)
  })

  return cellMap
}

export const createContext = (ContextStorage: CellStorage = {}): Context => {
  let cellMap = createCellMap(ContextStorage)

  let read: Context['read'] = (inputCell) => {
    let target = cellMap.get(inputCell.id)
    if (target) {
      return target[CellSymbol]
    }
    return inputCell[CellSymbol]
  }

  let write: Context['write'] = (inputCell, value) => {
    cellMap.set(inputCell.id, inputCell.create(value))
  }

  let context: Context = Object.freeze({
    [ContextSymbol]: true,
    read,
    write,
  })

  return context
}

export type Hooks = {
  useContext: () => Context
}

const { run, hooks } = createHooks<Hooks>({
  useContext: () => {
    throw new Error(`Can't call useContext out of scope, it should be placed on top of the function`)
  },
})

export const runContextHooks = run

export const { useContext } = hooks

export const fromContext = (context: Context): Hooks => ({
  useContext: () => {
    return context
  },
})

export const runWithContext = <F extends (...args: any) => any>(f: F, context: Context) => {
  return runContextHooks(f, fromContext(context))
}
