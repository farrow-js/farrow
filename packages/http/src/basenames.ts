import { createContext, Middleware, createPipeline, Pipeline, useContainer } from 'farrow-pipeline'
import { MaybeAsyncResponse } from './response'
import { RequestInfo } from './requestInfo'

export const BasenamesContext = createContext([] as string[])

export const useBasenames = () => {
  let basenames = BasenamesContext.use()
  return basenames
}

export const usePrefix = () => {
  let basenames = BasenamesContext.use().value
  return basenames.join('')
}

export const route = (name: string): Pipeline<RequestInfo, MaybeAsyncResponse> => {
  let pipeline = createPipeline<RequestInfo, MaybeAsyncResponse>()

  let middleware: Middleware<RequestInfo, MaybeAsyncResponse> = async (request, next) => {
    let container = useContainer()
    let basenames = BasenamesContext.use()

    if (!request.pathname.startsWith(name)) {
      return next()
    }

    let { basename, requestInfo } = handleBasenames([name], request)

    let currentBasenames = basenames.value

    basenames.value = [...currentBasenames, basename]

    let response = await pipeline.run(requestInfo, {
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
  let { basename, pathname } = findBasename(basenames, requestInfo.pathname)

  let newRequestInfo = {
    ...requestInfo,
    pathname,
  }

  return {
    basename,
    requestInfo: newRequestInfo,
  }
}

const findBasename = (basenames: string[], pathname: string) => {
  for (let basename of basenames) {
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
