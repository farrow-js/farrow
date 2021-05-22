import { createContext, Middleware, createPipeline, Pipeline, useContainer } from 'farrow-pipeline'
import { MaybeAsyncResponse } from './response'
import { RequestInfo } from './requestInfo'

export const BasenamesContext = createContext([] as string[])

export const useBasenames = () => {
  const basenames = BasenamesContext.use()
  return basenames
}

export const usePrefix = () => {
  const basenames = BasenamesContext.use().value
  return basenames.join('')
}

export const route = (name: string): Pipeline<RequestInfo, MaybeAsyncResponse> => {
  const pipeline = createPipeline<RequestInfo, MaybeAsyncResponse>()

  const middleware: Middleware<RequestInfo, MaybeAsyncResponse> = async (request, next) => {
    const container = useContainer()
    const basenames = BasenamesContext.use()

    if (!request.pathname.startsWith(name)) {
      return next()
    }

    const { basename, requestInfo } = handleBasenames([name], request)

    const currentBasenames = basenames.value

    basenames.value = [...currentBasenames, basename]

    const response = await pipeline.run(requestInfo, {
      container,
      onLast: () => {
        basenames.value = currentBasenames
        return next(request)
      },
    })

    basenames.value = currentBasenames

    return response
  }

  return {
    ...pipeline,
    middleware,
  }
}

export const handleBasenames = <T extends { pathname: string }>(basenames: string[], requestInfo: T) => {
  const { basename, pathname } = findBasename(basenames, requestInfo.pathname)

  const newRequestInfo = {
    ...requestInfo,
    pathname,
  }

  return {
    basename,
    requestInfo: newRequestInfo,
  }
}

const findBasename = (basenames: string[], pathname: string) => {
  for (const basename of basenames) {
    if (!pathname.startsWith(basename)) continue

    let newPathname = pathname.replace(basename, '')

    if (!newPathname.startsWith('/')) {
      newPathname = `/${newPathname}`
    }

    return {
      basename,
      pathname: newPathname,
    }
  }

  return {
    basename: '',
    pathname,
  }
}
