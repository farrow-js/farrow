import { createCell, Middleware } from 'farrow-core'

export const BasenamesCell = createCell([] as string[])

export const useBasenames = () => {
  let basenames = BasenamesCell.useCell()
  return basenames
}

export const usePrefix = () => {
  let basenames = BasenamesCell.useCell().value
  return basenames.join('')
}

export const route = <T extends { pathname: string }, U>(
  name: string,
  middleware: Middleware<T, U>,
): Middleware<T, U> => {
  return (request, next) => {
    let basenames = BasenamesCell.useCell()

    if (!request.pathname.startsWith(name)) {
      return next()
    }

    let { basename, requestInfo } = handleBasenames([name], request)

    let currentBasenames = basenames.value

    basenames.value = [...currentBasenames, basename]

    return middleware(requestInfo, (request) => {
      basenames.value = currentBasenames
      return next(request)
    })
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
      newPathname = '/' + newPathname
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
