export type JsonType =
  | number
  | string
  | boolean
  | null
  | undefined
  | JsonType[]
  | {
      toJSON(): string
    }
  | {
      [key: string]: JsonType
    }

export type AddTodoInput = {
  /**
   * @remarks a content of todo for creating
   */
  content: string
}

export type AddTodoOutput = {
  /**
   * @remarks Todo list
   */
  todos: Todo[]
}

export type RemoveTodoInput = {
  /**
   * @remarks Todo id for removing
   */
  id: number
}

export type RemoveTodoOuput = {
  /**
   * @remarks Remain todo list
   */
  todos: Todo[]
}

export type Todo = {
  /**
   * @remarks Todo id
   */
  id: number
  /**
   * @remarks Todo content
   */
  content: string
  /**
   * @remarks Todo status
   */
  completed: boolean
}

export type __Api__ = {
  /**
   * @remarks add todo
   */
  addTodo: (input: AddTodoInput) => Promise<AddTodoOutput>
  /**
   * @remarks remove todo
   */
  removeTodo: (input: RemoveTodoInput) => Promise<RemoveTodoOuput>
}

export type CreateApiOptions = {
  /**
   * a fetcher for api-client
   */
  fetcher: (input: { path: string[]; input: JsonType }) => Promise<JsonType>
}

export const createApiClient = (options: CreateApiOptions) => {
  return {
    /**
     * @remarks add todo
     */
    addTodo: (input: AddTodoInput) => options.fetcher({ path: ['addTodo'], input }) as Promise<AddTodoOutput>,
    /**
     * @remarks remove todo
     */
    removeTodo: (input: RemoveTodoInput) =>
      options.fetcher({ path: ['removeTodo'], input }) as Promise<RemoveTodoOuput>,
  }
}
