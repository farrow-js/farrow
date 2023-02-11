import nodeFetch from 'node-fetch'
import type { FormatResult } from 'farrow-api/dist/toJSON'
import { getIntrospectionUrl } from 'farrow-api-server'
import { Result, Ok, Err } from './result'
import type { Fetch } from './federation'

export type IntrospectionResult = Result<FormatResult>

export const getIntrospection = (src: string, fetch: Fetch = nodeFetch as any): Promise<IntrospectionResult> => {
  const url = getIntrospectionUrl(src)
  return fetch(url)
    .then((response) => {
      return response.json() as Promise<FormatResult>
    })
    .then((result) => {
      return Ok(result)
    })
    .catch((err) => {
      return Err(err.stack || err.message)
    })
}
