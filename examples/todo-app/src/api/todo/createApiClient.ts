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

/**
 * {@label AddTodoInput}
 */
export type AddTodoInput = {
  /**
   * @remarks a content of todo for creating
   */
  content: string
}

/**
 * {@label AddTodoOutput}
 */
export type AddTodoOutput = {
  /**
   * @remarks Todo list
   */
  todos: Todo[]
}

/**
 * {@label Todo}
 */
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

/**
 * {@label RemoveTodoInput}
 */
export type RemoveTodoInput = {
  /**
   * @remarks Todo id for removing
   */
  id: number
}

/**
 * {@label RemoveTodoOutput}
 */
export type RemoveTodoOutput = {
  /**
   * @remarks Remain todo list
   */
  todos: Todo[]
}

export type CreateApiClientOptions = {
  /**
   * a fetcher for api-client
   */
  fetcher: (input: { path: string[]; input: JsonType }) => Promise<JsonType>
}

export const createApiClient = (options: CreateApiClientOptions) => {
  return {
    /**
     * @remarks add todo
     */
    addTodo: (input: AddTodoInput) => options.fetcher({ path: ['addTodo'], input }) as Promise<AddTodoOutput>,
    /**
     * @remarks remove todo
     */
    removeTodo: (input: RemoveTodoInput) =>
      options.fetcher({ path: ['removeTodo'], input }) as Promise<RemoveTodoOutput>,
  }
}
