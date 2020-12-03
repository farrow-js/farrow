import { Router, Response } from 'farrow-http'
import { Int, JsonType } from 'farrow-schema'

import { fakeData, Todo } from '../data'

export const router = Router()

let uid = 0

export const ok = (data: JsonType) => {
  return Response.json({
    success: true,
    message: '',
    data,
  })
}

export const err = (message: string) => {
  return Response.json({
    success: false,
    message,
    data: null,
  })
}

router
  .match({
    pathname: '/',
  })
  .use(() => {
    return ok(fakeData)
  })

router
  .match({
    pathname: '/item/:todoId',
    params: {
      todoId: Int,
    },
  })
  .use((request) => {
    let todo = fakeData.find((todo) => todo.id === request.params.todoId)

    if (!todo) {
      return err(`Todo id is not found: ${request.params.todoId}`)
    }

    return ok(todo)
  })

router
  .match({
    pathname: '/create',
    method: 'POST',
    body: {
      content: String,
    },
  })
  .use(async (request) => {
    let todo: Todo = {
      id: uid++,
      content: request.body.content,
      completed: false,
    }

    fakeData.push(todo)

    return ok(todo)
  })

router
  .match({
    pathname: '/toggle/:todoId',
    method: 'POST',
    params: {
      todoId: Int,
    },
  })
  .use(async (request) => {
    let todo = fakeData.find((todo) => todo.id === request.params.todoId)

    if (!todo) {
      return err(`Todo id is not found: ${request.params.todoId}`)
    }

    todo.completed = !todo.completed

    return ok(todo)
  })

router
  .match({
    pathname: '/update/:todoId',
    method: 'POST',
    params: {
      todoId: Int,
    },
    body: {
      content: String,
    },
  })
  .use(async (request) => {
    let todo = fakeData.find((todo) => todo.id === request.params.todoId)

    if (!todo) {
      return err(`Todo id is not found: ${request.params.todoId}`)
    }

    todo.content = request.body.content

    return ok(todo)
  })

router
  .match({
    pathname: '/delete/:todoId',
    method: 'POST',
    params: {
      todoId: Int,
    },
  })
  .use(async (request) => {
    let index = fakeData.findIndex((todo) => todo.id === request.params.todoId)

    if (index === -1) {
      return err(`Todo id is not found: ${request.params.todoId}`)
    }

    let todo = fakeData[index]

    fakeData.splice(index, 1)

    return ok(todo)
  })
