import path from 'path'
import { createContext, Middleware, createPipeline, Pipeline, useContainer } from 'farrow-pipeline'
import { MaybeAsyncResponse } from './response'
import { RequestInfo } from './requestInfo'
import { isPromise } from './util'

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

  assertRoutePath(name, `expect the basename passed to 'http.route' should be absolute, accept \`${name}\``)

  const middleware: Middleware<RequestInfo, MaybeAsyncResponse> = (request, next) => {
    const container = useContainer()
    const basenames = BasenamesContext.use()

    if (!matchBasename(name, request.pathname)) {
      return next()
    }

    const { basename, requestInfo } = handleBasenames([name], request)

    const currentBasenames = basenames.value

    basenames.value = [...currentBasenames, basename]

    const maybeAsyncResponse = pipeline.run(requestInfo, {
      container,
      onLast: () => {
        basenames.value = currentBasenames
        return next(request)
      },
    })

    if (isPromise(maybeAsyncResponse)) {
      return maybeAsyncResponse.then((response) => {
        basenames.value = currentBasenames

        return response
      })
    }

    basenames.value = currentBasenames
    return maybeAsyncResponse
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
    if (!matchBasename(basename, pathname)) continue

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

export const matchBasename = (basename: string, pathname: string): boolean => {
  const baseSnippets = getPathSnippets(basename)
  const pathSnippets = getPathSnippets(pathname)

  for (let i = 0; i < baseSnippets.length; i++) {
    if (baseSnippets[i] !== pathSnippets[i]) {
      return false
    }
  }

  return true
}

export const getPathSnippets = (pathname: string): string[] => {
  const normalized = normalizePath(pathname)

  if (normalized === '/') return []

  return normalized.split('/').slice(1)
}

const normalizePath = (pathname: string): string => {
  let result = path.posix.normalize(pathname)

  if (result.endsWith('/')) {
    result = result.substring(0, result.length - 1)
  }

  if (!result.startsWith('/')) {
    result = `/${result}`
  }

  return result
}

const assertRoutePath = (pathname: string, message: string) => {
  if (!path.posix.isAbsolute(pathname)) {
    throw new Error(message)
  }
}
