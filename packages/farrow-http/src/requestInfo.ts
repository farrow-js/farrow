export type ReadOnlyRecord = {
  readonly [key: string]: any
}

export type RequestHeaders = ReadOnlyRecord

export type RequestCookies = ReadOnlyRecord

export type RequestQuery = ReadOnlyRecord

export type RequestInfo = {
  readonly pathname: string
  readonly method?: string
  readonly query?: RequestQuery
  readonly body?: any
  readonly headers?: RequestHeaders
  readonly cookies?: RequestCookies
}
