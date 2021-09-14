import { FormatResult } from 'farrow-api/dist/toJSON'
import nodeFetch from 'node-fetch'
import type { IntrospectionCalling, ApiResponseSingle } from 'farrow-api-server'
import { Result, Ok, Err } from './result'
import type { Fetch } from './federation'

export type IntrospectionResult = Result<FormatResult>

export const getIntrospection = async (src: string, fetch: Fetch = nodeFetch as any): Promise<IntrospectionResult> => {
  const data: IntrospectionCalling = {
    type: 'Introspection',
  }

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }

  try {
    return fetch(src, options)
      .then(async (response) => {
        return response.json() as Promise<ApiResponseSingle>
      })
      .then((result) => {
        if (result.type === 'ApiSuccessResponse') {
          return Ok(result.output as FormatResult)
          // eslint-disable-next-line no-else-return
        } else {
          return Err('Server Introspection Error')
        }
      })
      .catch((err) => {
        return Err(err.message)
      })
  } catch (err) {
    return Err('Server cannot be reached.')
  }
}
