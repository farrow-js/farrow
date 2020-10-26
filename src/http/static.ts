import path from 'path'
import { Middleware } from '../core/pipeline'
import { Response, ResponseOutput } from './index'

export const serve = <T extends { pathname: string }>(
  dirname: string
): Middleware<T, ResponseOutput> => {
  return (request) => {
    let filename = path.join(dirname, request.pathname)
    return Response.file(filename)
  }
}
