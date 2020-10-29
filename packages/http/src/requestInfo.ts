export type RequestHeaders = Record<string, string>

export type RequestCookies = Record<string, string>

export type RequestQuery = Record<string, string | string[]>

export type RequestInfo = {
  pathname: string
  method?: string
  query?: RequestQuery
  body?: any
  headers?: RequestCookies
  cookies?: RequestCookies
}
