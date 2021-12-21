import { createPipeline, Middleware } from './pipeline'

export type MiddlewareReturnType<T> = void | undefined | T | Promise<T | void | undefined>

export type KoaMiddleware<T, U = void> = Middleware<T, MiddlewareReturnType<U>>

export const compose = <T, U>(middlewares: KoaMiddleware<T, U>[]) => {
  if (!Array.isArray(middlewares)) {
    throw new TypeError('Middleware stack must be an array!')
  }

  for (const fn of middlewares) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions!')
    }
  }

  return (context: T, next?: KoaMiddleware<T, U>) => {
    const pipeline = createPipeline<T, MiddlewareReturnType<U>>()

    pipeline.use(...middlewares.map(toKoaMiddleware))

    if (next) pipeline.use(next)

    return pipeline.run(context, {
      onLast: async () => {},
    })
  }
}

const toKoaMiddleware = <T, U>(middleware: KoaMiddleware<T, U>): typeof middleware => {
  return (context, next) => {
    let count = 0
    return middleware(context, async (context) => {
      if (count++ > 0) throw new Error('next() called multiple times')
      return next(context)
    })
  }
}
