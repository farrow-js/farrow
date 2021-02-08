export type AddTodoInputType = {
  /**
   * @remarks Todo Content
   */
  content: string
}

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

export type RemoveTodoInputType = {
  /**
   * @remarks Todo id to remove
   */
  id: string
}

type Type4 = {}

export type Nest = {
  /**
   * @remarks value of Nest
   */
  value: number
  /**
   * @remarks next of Nest
   */
  next: Nest | null | undefined
}

export type __API__ = {
  todo: {
    /**
     * @remarks add todo
     */
    addTodo: (input: AddTodoInputType) => Promise<TodoType[]>
    /**
     * @remarks remove todo
     */
    removeTodo: (input: RemoveTodoInputType) => Promise<TodoType[]>
  }
  recurse: {
    /**
     * @remarks getNest
     */
    getNest: (input: Type4) => Promise<Nest | null | undefined>
  }
}
