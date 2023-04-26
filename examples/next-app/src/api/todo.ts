/**
 * This file was generated by farrow-api
 * Don't modify it manually
*/

export type JsonType =
  | number
  | string
  | boolean
  | null
  | undefined
  | JsonType[]
  | { toJSON(): string }
  | { [key: string]: JsonType }

/**
 * @label AddTodoInput
*/
export type AddTodoInput = {
  /**
  * @remarks a content of todo for creating
  */
  content: string
}

/**
 * @label AddTodoOutput
*/
export type AddTodoOutput = {
  /**
  * @remarks Todo list
  */
  todos: (Todo)[]
}

/**
 * @label Todo
*/
export type Todo = {
  /**
  * @remarks Todo id
  */
  id: number,
  /**
  * @remarks Todo content
  */
  content: string,
  /**
  * @remarks Todo status
  */
  completed: boolean,
  /**
  * @remarks Todo create time
  */
  createAt?: string | null | undefined
}

/**
 * @label RemoveTodoInput
*/
export type RemoveTodoInput = {
  /**
  * @remarks Todo id for removing
  */
  id: number
}

/**
 * @label RemoveTodoOutput
*/
export type RemoveTodoOutput = {
  /**
  * @remarks Remain todo list
  */
  todos: (Todo)[]
}

export type ApiClientLoaderInput = {
  path: string[]
  input: JsonType
}

export interface ApiClientLoaderOptions {
  batch?: boolean
  stream?: boolean
}

export type ApiClientOptions = {
  loader: (input: ApiClientLoaderInput, options?: ApiClientLoaderOptions) => Promise<JsonType>
}

export const createApiClient = (options: ApiClientOptions) => {
  return {
    /**
    * @remarks add todo
    */
    addTodo: (input: AddTodoInput, loaderOptions?: ApiClientLoaderOptions) => {
      return options.loader(
        {
          path: ['addTodo'],
          input: input as JsonType,
        },
        loaderOptions
      ) as Promise<AddTodoOutput>
    },
    /**
    * @remarks remove todo
    */
    removeTodo: (input: RemoveTodoInput, loaderOptions?: ApiClientLoaderOptions) => {
      return options.loader(
        {
          path: ['removeTodo'],
          input: input as JsonType,
        },
        loaderOptions
      ) as Promise<RemoveTodoOutput>
    }
  }
}