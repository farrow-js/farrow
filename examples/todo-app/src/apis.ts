import { createLoader } from 'farrow-api-client'
import { createApiClient as createExampleApiClient } from './__generated__/example'

export const ExampleApi = createExampleApiClient({
  loader: createLoader('/api/example'),
})
