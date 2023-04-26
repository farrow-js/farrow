import { createLoader } from 'farrow-api-client'
import { createApiClient as createTodoApiClient } from './api/todo'

export const TodoApi = createTodoApiClient({
  loader: createLoader('/api/todo'),
})
