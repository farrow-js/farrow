import { Type, ID, String, List, TypeOf, ObjectType, Nullable, Prettier } from 'farrow-schema'
import { Api } from './api'
import { toJSON } from './toJSON'

import fs from 'fs/promises'
import { codegen } from './codegen'
import { format } from './prettier'

export class TodoType extends ObjectType {
  id = {
    description: 'Todo id',
    [Type]: ID,
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

class Nest extends ObjectType {
  value = {
    description: 'value of Nest',
    [Type]: Number,
  }
  next = {
    description: 'next of Nest',
    [Type]: Nullable(Nest),
  }
}

const getNest = Api(
  {
    description: 'getNest',
    input: {},
    output: {
      description: 'nest data',
      [Type]: Nullable(Nest),
    },
  },
  () => {
    throw new Error('No impl')
  },
)

type T0 = Prettier<typeof getNest>

export type Todo = TypeOf<typeof TodoType>

export const TodoListType = List(TodoType)

class AddTodoInputType extends ObjectType {
  content = {
    description: 'Todo Content',
    [Type]: String,
  }
}

const addTodo = Api(
  {
    description: 'add todo',
    input: {
      description: 'input type of add todo',
      [Type]: AddTodoInputType,
    },
    output: {
      description: 'Todo list',
      [Type]: TodoListType,
    },
  },
  (input) => {
    let todo: Todo = {
      id: '123123',
      content: input.content,
      completed: false,
    }
    return [todo]
  },
)

export class RemoveTodoInputType extends ObjectType {
  id = {
    description: 'Todo id to remove',
    [Type]: ID,
  }
}

// export const RemoveTodoInputType = Struct({
//   id: {
//     description: 'Todo id to remove',
//     [Type]: ID,
//   },
// })

export const removeTodo = Api(
  {
    description: 'remove todo',
    input: {
      description: 'input type of remove todo',
      [Type]: RemoveTodoInputType,
    },
    output: {
      description: 'Todo list',
      [Type]: TodoListType,
    },
  },
  (input) => {
    throw new Error('No impl')
  },
)

export const todoApi = {
  addTodo,
  removeTodo,
}

export const rootApi = {
  todo: todoApi,
  recurse: {
    getNest,
  },
}

const json = toJSON(rootApi)

console.log('json', JSON.stringify(json, null, 2))

const testCodegen = async () => {
  let code = codegen(json)
  await fs.writeFile(`${__dirname}/test.schema.ts`, format(code))
}

testCodegen().catch((error) => console.log('error', error))
