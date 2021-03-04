import { PageContextType } from './page'

export class PageInfo {
  /**
   * userAgent
   */
  userAgent?: string

  /**
   * Error object if encountered during rendering
   */
  err?: PageContextType['err']

  /**
   * `HTTP` request object.
   */
  req?: PageContextType['req']

  /**
   * `HTTP` response object.
   */
  res?: PageContextType['res']

  /**
   * Path section of `URL`.
   */
  pathname!: PageContextType['pathname']

  /**
   * Query string section of `URL` parsed as an object.
   */
  query!: PageContextType['query']

  /**
   * `String` of the actual path including query.
   */
  asPath?: PageContextType['asPath']

  /**
   * `Component` the tree of the App to use if needing to render separately
   */
  constructor(ctx: PageContextType) {
    Object.assign(this, ctx)
  }
}
