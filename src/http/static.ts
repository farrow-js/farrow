import path from 'path'
import { Middleware } from '../core/pipeline'
import { Response, ResponseOutput } from './index'

export type StaticOptions = {
  dirname: string
}

export const createStatic = <T extends { pathname: string }>(
  options: StaticOptions
): Middleware<T, ResponseOutput> => {
  return (request) => {
    let filename = path.join(options.dirname, request.pathname)
    return Response.file(filename)
  }
}
