import { Any, Int, List, ObjectType, Type, TypeOf } from 'farrow-schema'
import { Api } from 'farrow-api'
import { ApiService } from 'farrow-api-server'
import fs from 'fs'
import path from 'path'

const largeJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../large-file.json'), 'utf-8'))

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

export const TodoList = List(Todo)

export type TodoListType = TypeOf<typeof TodoList>

const state: { uid: number; todos: TodoListType } = {
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
    [Type]: TodoList,
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

export class UpdateTodoInput extends ObjectType {
  id = {
    description: 'Todo id for updating',
    [Type]: Int,
  }

  content = {
    description: 'Todo content for updating',
    [Type]: String,
  }
}

export class UpdateTodoOutput extends ObjectType {
  todos = {
    description: 'Todo list',
    [Type]: TodoList,
  }
}

export const updateTodo = Api(
  {
    description: 'update todo',
    input: UpdateTodoInput,
    output: UpdateTodoOutput,
  },
  async (input) => {
    if (input.content === '') {
      const result = await removeTodo({ id: input.id })
      return {
        todos: result.todos,
      }
    }

    state.todos = state.todos.map((todo) => {
      if (todo.id === input.id) {
        return {
          ...todo,
          content: input.content,
        }
      }
      return todo
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
    [Type]: TodoList,
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

export const longTask = Api(
  {
    description: 'long task',
    input: {},
    output: {
      time: {
        description: 'time cost',
        [Type]: Number,
      },
      data: {
        description: 'data',
        [Type]: Any,
      },
    },
  },
  async () => {
    const time = 5000 + Math.random() * 1000
    await new Promise((resolve) => {
      setTimeout(resolve, time)
    })
    return {
      time: time,
      data: largeJson,
    }
  },
)


class HelloInput extends ObjectType {
  name = String
}

class HelloOutput extends ObjectType {
  message = String
}

export const hello = Api(
  {
    // deprecated: `use \`addTodo\` instead`,
    input: HelloInput,
    output: HelloOutput,
  },
  async ({ name }) => {
    if (name === '') {
      throw new Error('name is empty')
    }

    return {
      message: `Hello ${name}!`,
    }
  },
)



export const entries = {
  hello,
  addTodo,
  updateTodo,
  removeTodo,
  longTask,
}

export const service = ApiService({
  entries,
})
