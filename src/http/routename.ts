import { createCell, Middleware, useCell } from '../core/pipeline'
import { handleBasenames } from './basename'

export const RoutenameCell = createCell<string>('')

export const useRoutename = () => {
  let routename = useCell(RoutenameCell)

  return routename
}

export const route = <T extends { pathname: string }, U>(
  name: string,
  middleware: Middleware<T, U>
): Middleware<T, U> => {
  return (request, next) => {
    let routename = useRoutename()

    if (!request.pathname.startsWith(name)) {
      return next()
    }

    let result = handleBasenames([name], request)

    let previous = routename.value

    routename.value = previous + name

    return middleware(result.request, (request) => {
      routename.value = previous
      return next(request)
    })
  }
}
