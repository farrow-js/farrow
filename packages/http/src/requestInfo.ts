export type RequestHeaders = Record<string, any>

export type RequestCookies = Record<string, any>

export type RequestQuery = Record<string, any>

export type RequestInfo = {
  pathname: string
  method?: string
  query?: RequestQuery
  body?: any
  headers?: RequestHeaders
  cookies?: RequestCookies
}
