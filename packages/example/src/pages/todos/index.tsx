import React from 'react'

import { Router, Response } from 'farrow-http'
import { Int } from 'farrow-schema'

import { fakeData } from '../../data'

import { useLayoutView } from '../components/Layout'
import { NoCache } from '../../middleware/NoCache'

import { Home } from './Home'
import { Create } from './Create'
import { Update } from './Update'

export const router = Router()

router
  .match({
    pathname: '/',
  })
  .use(NoCache())
  .use(async () => {
    let LayoutView = useLayoutView()
    return LayoutView.render(<Home todos={fakeData} />)
  })

router
  .match({
    pathname: '/create',
  })
  .use(NoCache())
  .use(async () => {
    let LayoutView = useLayoutView()
    return LayoutView.render(<Create />)
  })

router
  .match({
    pathname: '/update/:todoId',
    params: {
      todoId: Int,
    },
  })
  .use(NoCache())
  .use(async (request) => {
    let LayoutView = useLayoutView()
    let todo = fakeData.find((todo) => todo.id === request.params.todoId)

    if (!todo) {
      return Response.status(404).text(`todo is not found, id: ${request.params.todoId}`)
    }

    return LayoutView.render(<Update todo={todo} />)
  })
