import { Int, List, ObjectType, Type, TypeOf } from 'farrow-schema'
import { Api } from 'farrow-api'
import { ApiService } from 'farrow-api-server'

export class Todo extends ObjectType {
  id = {
    description: `Todo id`,
    [Type]: Int,
  }

  content = {
    description: 'Todo content',
    [Type]: String,
  }

  completed = {
    description: 'Todo status',
    [Type]: Boolean,
  }
}

export type TodoType = TypeOf<Todo>

export const Todos = List(Todo)

export type TodosType = TypeOf<typeof Todos>

const state: { uid: number; todos: TodosType } = {
  uid: 0,
  todos: [
    {
      id: -1,
      content: 'Learn Farrow',
      completed: true,
    },
    {
      id: -2,
      content: 'Learn TypeScript',
      completed: true,
    },
  ],
}

export class AddTodoInput extends ObjectType {
  content = {
    description: 'a content of todo for creating',
    [Type]: String,
  }
}

export class AddTodoOutput extends ObjectType {
  todos = {
    description: 'Todo list',
    [Type]: Todos,
  }
}

export const addTodo = Api(
  {
    description: 'add todo',
    input: AddTodoInput,
    output: AddTodoOutput,
  },
  (input) => {
    state.todos.push({
      id: state.uid++,
      content: input.content,
      completed: false,
    })
    return {
      todos: state.todos,
    }
  },
)

export class RemoveTodoInput extends ObjectType {
  id = {
    description: 'Todo id for removing',
    [Type]: Int,
  }
}

export class RemoveTodoOutput extends ObjectType {
  todos = {
    description: 'Remain todo list',
    [Type]: Todos,
  }
}

export const removeTodo = Api(
  {
    description: 'remove todo',
    input: RemoveTodoInput,
    output: RemoveTodoOutput,
  },
  (input) => {
    state.todos = state.todos.filter((todo) => todo.id !== input.id)
    return {
      todos: state.todos,
    }
  },
)

export const entries = {
  addTodo,
  removeTodo,
}

export const service = ApiService({
  entries,
})
