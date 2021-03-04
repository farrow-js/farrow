import { Controller as BaseController } from 'farrow-next'
import { JsonType, createApiClient as createTodoApi, CreateApiClientOptions } from './api/todo'

const url = `http://localhost:3002/api`

type ApiErrorResponse = {
  error: {
    message: string
  }
}

type ApiSuccessResponse = {
  output: JsonType
}

type ApiResponse = ApiErrorResponse | ApiSuccessResponse

export const createApi = <T>(name: string, createApiClient: (options: CreateApiClientOptions) => T) =>
  createApiClient({
    fetcher: async (input) => {
      let options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      }
      let response = await fetch(`${url}/${name}`, options)
      let text = await response.text()

      try {
        let json = JSON.parse(text) as ApiResponse
        if ('error' in json) {
          throw new Error(json.error.message)
        } else {
          return json.output
        }
      } catch (error) {
        console.log({ error, text })
        throw error
      }
    },
  })

export class Controller extends BaseController {
  api = {
    todo: createApi('todo', createTodoApi),
  }
}
