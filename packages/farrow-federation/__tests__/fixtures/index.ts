import { Router } from 'farrow-http'
import { services as foo } from './foo'
import { services as bar } from './bar'
import { services as baz } from './baz'

export const services = Router()

// attach greet service
services.use(foo)
services.use(bar)
services.use(baz)
