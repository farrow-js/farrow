export type Next = () => Promise<void>

export type Middleware = (next: Next) => void
export type Middlewares = Middleware[]

export const runMiddlewares = (middlewares: Middlewares, next: Next) => {
  let latestIndex = -1
  let dispatch = (index: number): Promise<void> => {
    if (index <= latestIndex) {
      let error = new Error(`Middleware called next() multiple times`)
      return Promise.reject(error)
    }

    if (index === middlewares.length) {
      return Promise.resolve(next())
    }

    latestIndex = index

    let fn = middlewares[index]

    try {
      return Promise.resolve(fn(dispatch.bind(null, index + 1)))
    } catch (error) {
      return Promise.reject(error)
    }
  }
  return dispatch(0)
}
