import { Router } from 'farrow-http'
import { getTodos } from './getTodos'
import { ApiService } from 'farrow-api-server'

const entries = {
  getTodos,
}

export const service = ApiService({ entries })

export const services = Router()

// attach greet service
services.route('/foo').use(service)
