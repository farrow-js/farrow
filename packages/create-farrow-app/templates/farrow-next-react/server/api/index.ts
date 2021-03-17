import { Router } from 'farrow-http'
import { service as GreetService } from './greet'

export const services = Router()

// attach greet service
services.route('/api/greet').use(GreetService)
