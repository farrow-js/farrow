# farrow-api

**farrow-api**: Schema-based Api builder

## Setup

Install via npm or yarn

```shell
# via npm
npm install --save farrow-api

# via yarn
yarn add farrow-api
```

## Usage

Writing `farrow-api` is just like typing in a higher-order way, we define a api-type via `farrow-schema`. And then use [farrow-api-server](../farrow-api-server/README.md) to attach api to a http server.

```typescript
import { Api } from 'farrow-api'
import { Int, List, ObjectType, Type, TypeOf } from 'farrow-schema'

/**
 * define Todo
 */
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

// infer the type of Todo
export type TodoType = TypeOf<Todo>

// define Todos
export const Todos = List(Todo)

// define AddTodoInput
export class AddTodoInput extends ObjectType {
  content = {
    description: 'a content of todo for creating',
    [Type]: String,
  }
}

// define AddTodoInput
export class AddTodoOutput extends ObjectType {
  todos = {
    description: 'Todo list',
    [Type]: Todos,
  }
}

// define an api via input schema and output schema
export const addTodo = Api(
  {
    description: 'add todo',
    input: AddTodoInput,
    output: AddTodoOutput,
  },
  (input) => {
    // impl addTodo
    return {
      todos: [],
    }
  },
)

// define RemoveTodoInput
export class RemoveTodoInput extends ObjectType {
  id = {
    description: 'Todo id for removing',
    [Type]: Int,
  }
}

// define RemoveTodoOuput
export class RemoveTodoOuput extends ObjectType {
  todos = {
    description: 'Remain todo list',
    [Type]: Todos,
  }
}

// define an api without impl
export const removeTodo = Api({
  description: 'remove todo',
  input: RemoveTodoInput,
  output: RemoveTodoOuput,
})

// an api is also a pipeline
removeTodo.use((input, next) => {
  return next(input)
})

// impl remove todo via pipeline.use
removeTodo.use((input) => {
  state.todos = state.todos.filter((todo) => todo.id !== input.id)
  return {
    todos: state.todos,
  }
})

// combine all api to an object/entries
export const entries = {
  addTodo,
  removeTodo,
}
```

## API

```typescript
/**
 * create Api via ApiDefinition
 */
const Api: (definition: ApiDefinition, impl?: ApiImpl<T> | undefined) => ApiType<T>

/**
 * ApiDefinition
 */
export type ApiDefinition = {
  /**
   * input schema of api
   */
  input: SchemaCtorInput
  /**
   * output schema of api
   */
  output: SchemaCtorInput
  /**
   * description of api
   */
  description?: string
  /**
   * depcreated info of api if needed
   */
  deprecated?: string
}
```
