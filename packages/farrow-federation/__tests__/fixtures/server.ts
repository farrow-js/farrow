import { Http } from 'farrow-http'
import { cors } from 'farrow-cors'
import { createFederationServices } from '../../src'

async function bootstrap() {
  const http = Http()
  http.use(cors({ origin: 'http://localhost:3000', credentials: true }))

  const service = await createFederationServices([
    {
      url: 'http://localhost:3003/api/todo',
      namespace: 'todo',
    },
  ])

  http.use(service)

  http.listen(3001)
}

void bootstrap()
