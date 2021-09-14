import { Api } from 'farrow-api'
import { ApiService } from 'farrow-api-server'
import { Int, List, Literal, Nullable, ObjectType, Type, TypeOf, Union } from 'farrow-schema'

export class Todo extends ObjectType {
  id = {
    description: 'todo id',
    [Type]: Int,
  }
  content = {
    description: 'todo content',
    [Type]: String,
  }
  completed = {
    description: 'todo status',
    [Type]: Boolean,
  }
}

export type TodoType = TypeOf<Todo>

export const Todos = List(Todo)

let uid = 0

let todos: TodoType[] = []

export const getTodos = Api(
  {
    description: 'get todos',
    input: {},
    output: {
      todos: {
        description: 'all todos',
        [Type]: Todos,
      },
    },
  },
  () => {
    return {
      todos,
    }
  },
)

export class AddTodoInput extends ObjectType {
  content = {
    description: 'todo content to add',
    [Type]: String,
  }
}

export class InvalidAddTodoInput extends ObjectType {
  type = Literal('InvalidAddTodoInput')
  message = String
}

export class AddTodoSuccess extends ObjectType {
  type = Literal('AddTodoSuccess')
  todo = {
    description: 'a new todo',
    [Type]: Todo,
  }
}

const AddTodoOutput = Union(InvalidAddTodoInput, AddTodoSuccess)

AddTodoOutput.displayName = 'AddTodoOutput'

export const addTodo = Api(
  {
    description: 'add todo',
    input: AddTodoInput,
    output: AddTodoOutput,
  },
  (input) => {
    if (input.content.length === 0) {
      return InvalidAddTodoInput.create({
        type: 'InvalidAddTodoInput',
        message: 'todo content is empty',
      })
    }

    const todo: TodoType = {
      id: uid++,
      content: input.content,
      completed: false,
    }

    todos.push(todo)

    return AddTodoSuccess.create({
      type: 'AddTodoSuccess',
      todo,
    })
  },
)

export class RemoveTodoInput extends ObjectType {
  todoId = {
    description: 'todo id wait for removing',
    [Type]: Int,
  }
}

export class TodoIdNotFound extends ObjectType {
  type = Literal('TodoIdNotFound')
  todoId = {
    description: 'invalid todo id',
    [Type]: Int,
  }
}

export class RemoveTodoSuccess extends ObjectType {
  type = Literal('RemoveTodoSuccess')
  todoId = {
    description: 'todo id that removed',
    [Type]: Int,
  }
  todos = {
    description: 'current todos',
    [Type]: Todos,
  }
}

export const RemoveTodoOutput = Union(TodoIdNotFound, RemoveTodoSuccess)

export const removeTodo = Api(
  {
    description: 'remove todo',
    input: RemoveTodoInput,
    output: RemoveTodoOutput,
    deprecated: 'test',
  },
  (input) => {
    const index = todos.findIndex((todo) => todo.id === input.todoId)

    if (index === -1) {
      return TodoIdNotFound.create({
        type: 'TodoIdNotFound',
        todoId: input.todoId,
      })
    }

    todos.splice(index, 1)

    return RemoveTodoSuccess.create({
      type: 'RemoveTodoSuccess',
      todoId: input.todoId,
      todos,
    })
  },
)

export class UpdateTodoInput extends ObjectType {
  todoId = {
    description: 'todo id wait for update',
    [Type]: Int,
  }
  content? = {
    description: 'new todo content',
    [Type]: Nullable(String),
  }
  completed? = {
    description: 'new todo status',
    [Type]: Nullable(Boolean),
  }
}

export class UpdateTodoSuccess extends ObjectType {
  type = Literal('UpdateTodoSuccess')
  todoId = {
    description: 'todo id that updated',
    [Type]: Int,
  }
  todos = {
    description: 'current todos',
    [Type]: Todos,
  }
}

export const UpdateTodoOutput = Union(TodoIdNotFound, UpdateTodoSuccess)

UpdateTodoOutput.displayName = 'UpdateTodoOutput'

export const updateTodo = Api(
  {
    description: 'update todo',
    input: UpdateTodoInput,
    output: UpdateTodoOutput,
  },
  (input) => {
    const targetTodo = todos.find((todo) => todo.id === input.todoId)

    if (!targetTodo) {
      return TodoIdNotFound.create({
        type: 'TodoIdNotFound',
        todoId: input.todoId,
      })
    }

    if (typeof input.content === 'string') {
      targetTodo.content = input.content
    }

    if (typeof input.completed === 'boolean') {
      targetTodo.completed = input.completed
    }

    return UpdateTodoSuccess.create({
      type: 'UpdateTodoSuccess',
      todoId: input.todoId,
      todos,
    })
  },
)

export const clearCompleted = Api(
  {
    description: 'clear completed',
    input: {},
    output: {
      todos: {
        description: 'current todos',
        [Type]: Todos,
      },
    },
  },
  () => {
    todos = todos.filter((todo) => todo.completed === false)

    return {
      todos,
    }
  },
)

export const service = ApiService({
  entries: {
    getTodos,
    addTodo,
    new: {
      removeTodo,
      updateTodo,
      clearCompleted,
    },
  },
})
