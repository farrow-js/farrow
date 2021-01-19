import { RequestInfo, HttpPipeline, HttpMiddleware, useRes, useReq, Http, Response } from 'farrow-http'
import { CorsOptions, cors as farrowCors } from 'farrow-cors'
import {
  renderPlaygroundPage,
  RenderPageOptions as PlaygroundRenderPageOptions,
} from '@apollographql/graphql-playground-html'
import {
  ApolloServerBase,
  FileUploadOptions,
  GraphQLOptions,
  formatApolloErrors,
  processFileUploads,
} from 'apollo-server-core'
import accepts from 'accepts'
import typeis from 'type-is'

import { graphqlFarrow } from './farrowApollo'

export { GraphQLOptions, GraphQLExtension } from 'apollo-server-core'

export interface GetMiddlewareOptions {
  path?: string
  cors?: CorsOptions | boolean
  onHealthCheck?: (req: RequestInfo) => Promise<any>
  disableHealthCheck?: boolean
}

export interface ServerRegistration extends GetMiddlewareOptions {
  app: HttpPipeline
}

const fileUploadMiddleware = (uploadsConfig: FileUploadOptions, server: ApolloServerBase): HttpMiddleware => async (
  req,
  next,
) => {
  if (typeis(useReq(), ['multipart/form-data'])) {
    try {
      let body = await processFileUploads?.(useReq(), useRes(), uploadsConfig)
      return next({ ...req, body })
    } catch (error) {
      if (error.status && error.expose) useRes().statusCode = error.status

      throw formatApolloErrors([error], {
        formatter: server.requestOptions.formatError,
        debug: server.requestOptions.debug,
      })
    }
  } else {
    return next()
  }
}

const middlewareFromPath = (path: string, middleware: HttpMiddleware): HttpMiddleware => (req, next) => {
  if (req.pathname === path) {
    return middleware(req, next)
  }
  return next()
}

export class ApolloServer extends ApolloServerBase {
  // This translates the arguments from the middleware into graphQL options It
  // provides typings for the integration specific behavior, ideally this would
  // be propagated with a generic to the super class
  createGraphQLServerOptions(req: RequestInfo): Promise<GraphQLOptions> {
    return super.graphQLServerOptions({ req })
  }

  protected static supportsSubscriptions(): boolean {
    return true
  }

  protected static supportsUploads(): boolean {
    return true
  }

  public applyMiddleware({ app, ...rest }: ServerRegistration) {
    app.use(this.getMiddleware(rest))
  }

  // TODO: While Koa is Promise-aware, this API hasn't been historically, even
  // though other integration's (e.g. Hapi) implementations of this method
  // are `async`.  Therefore, this should become `async` in a major release in
  // order to align the API with other integrations.
  public getMiddleware({ path, cors, disableHealthCheck, onHealthCheck }: GetMiddlewareOptions = {}): HttpMiddleware {
    if (!path) path = '/graphql'

    // Despite the fact that this `applyMiddleware` function is `async` in
    // other integrations (e.g. Hapi), currently it is not for Koa (@here).
    // That should change in a future version, but that would be a breaking
    // change right now (see comment above this method's declaration above).
    //
    // That said, we do need to await the `willStart` lifecycle event which
    // can perform work prior to serving a request.  While we could do this
    // via awaiting in a Koa middleware, well kick off `willStart` right away,
    // so hopefully it'll finish before the first request comes in.  We won't
    // call `next` until it's ready, which will effectively yield until that
    // work has finished.  Any errors will be surfaced to Koa through its own
    // native Promise-catching facilities.
    let promiseWillStart = this.willStart()
    let middlewares: HttpMiddleware[] = []
    middlewares.push(
      middlewareFromPath(path, async (_req, next) => {
        await promiseWillStart
        return next()
      }),
    )

    if (!disableHealthCheck) {
      middlewares.push(
        middlewareFromPath('/.well-known/apollo/server-health', (req) => {
          let res = Response
          // Response follows https://tools.ietf.org/html/draft-inadarei-api-health-check-01
          res = res.header('Content-Type', 'application/health+json')

          if (onHealthCheck) {
            return onHealthCheck(req)
              .then(() => {
                return res.json({ status: 'pass' })
              })
              .catch(() => {
                return res.status(503).json({ status: 'fail' })
              })
          }
          return res.json({ status: 'pass' })
        }),
      )
    }

    let uploadsMiddleware
    if (this.uploadsConfig && typeof processFileUploads === 'function') {
      uploadsMiddleware = fileUploadMiddleware(this.uploadsConfig, this)
    }

    this.graphqlPath = path

    if (cors === true) {
      middlewares.push(middlewareFromPath(path, farrowCors()))
    } else if (cors !== false) {
      middlewares.push(middlewareFromPath(path, farrowCors(cors)))
    }

    if (uploadsMiddleware) {
      middlewares.push(middlewareFromPath(path, uploadsMiddleware))
    }

    middlewares.push(
      middlewareFromPath(path, (req, next) => {
        if (req.method === 'OPTIONS') {
          return Response.status(204)
        }

        if (this.playgroundOptions && req.method === 'GET') {
          // perform more expensive content-type check only if necessary
          let accept = accepts(useReq())
          let types = accept.types() as string[]
          let prefersHTML = types.find((x: string) => x === 'text/html' || x === 'application/json') === 'text/html'

          if (prefersHTML) {
            let playgroundRenderPageOptions: PlaygroundRenderPageOptions = {
              endpoint: path,
              subscriptionEndpoint: this.subscriptionsPath,
              ...this.playgroundOptions,
            }
            let playground = renderPlaygroundPage(playgroundRenderPageOptions)
            return Response.html(playground)
          }
        }

        return graphqlFarrow(() => {
          return this.createGraphQLServerOptions(req)
        })(req, next)
      }),
    )
    let http = Http()
    http.use(...middlewares)
    return http.middleware
  }
}
