import { createProvider } from 'farrow-module'
import { NextPageContext } from 'next'

export type PageInfo = {
  /**
   * userAgent
   */
  userAgent?: string

  /**
   * Error object if encountered during rendering
   */
  err?: NextPageContext['err']

  /**
   * `HTTP` request object.
   */
  req?: NextPageContext['req']

  /**
   * `HTTP` response object.
   */
  res?: NextPageContext['res']

  /**
   * Path section of `URL`.
   */
  pathname: NextPageContext['pathname']

  /**
   * Query string section of `URL` parsed as an object.
   */
  query: NextPageContext['query']

  /**
   * `String` of the actual path including query.
   */
  asPath?: NextPageContext['asPath']
}

export const GetPageInfo = createProvider<() => PageInfo>()
