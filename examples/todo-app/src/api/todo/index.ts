import { createApiClient, JsonType } from './createApiClient'
export * from './createApiClient'

const url = `http://localhost:3002/api/todo`

type ApiErrorResponse = {
  error: {
    message: string
  }
}

type ApiSuccessResponse = {
  output: JsonType
}

type ApiResponse = ApiErrorResponse | ApiSuccessResponse

export const api = createApiClient({
  fetcher: async (input) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
    const response = await fetch(url, options)
    const text = await response.text()

    try {
      const json = JSON.parse(text) as ApiResponse
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
