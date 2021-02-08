type Prettier<T> = T extends Promise<infer U>
  ? Promise<Prettier<U>>
  : T extends (...args: infer Args) => infer Return
  ? (...args: Prettier<Args>) => Prettier<Return>
  : T extends object | any[]
  ? {
      [key in keyof T]: Prettier<T[key]>
    }
  : T

export type AddTodoInputType = {
  /**
   * @remarks Todo Content
   */
  content: string
}

type Type0 = AddTodoInputType

export type TodoType = {
  /**
   * @remarks Todo id
   */
  id: string
  /**
   * @remarks Todo content
   */
  content: string
  /**
   * @remarks Todo status
   */
  completed: boolean
}

type Type1 = TodoType

type Type2 = Type1[]

export type RemoveTodoInputType = {
  /**
   * @remarks Todo id to remove
   */
  id: string
}

type Type3 = RemoveTodoInputType

type Type4 = {}

export type Nest = {
  /**
   * @remarks value of Nest
   */
  value: number
  /**
   * @remarks next of Nest
   */
  next: Type11
}

type Type5 = Nest

type Type6 = Type5 | null | undefined

type Type11 = Type5 | null | undefined

export type __OriginalAPI__ = {
  todo: {
    /**
     * @remarks add todo
     */
    addTodo: (input: Type0) => Promise<Type2>
    /**
     * @remarks remove todo
     */
    removeTodo: (input: Type3) => Promise<Type2>
  }
  recurse: {
    /**
     * @remarks getNest
     */
    getNest: (input: Type4) => Promise<Type6>
  }
}

export type __API__ = Prettier<__OriginalAPI__>
