import { Response, Router } from 'farrow-http'
import { service as TodoService } from './example'

export const services = Router()

// capture json response and do something if needed
services.capture('json', (body) => {
  if (typeof body.value === 'object') {
    return Response.json({
      ...body.value,
    })
  }
  return Response.json(body.value)
})

// attach todo api
services.route('/api/example').use(TodoService)
