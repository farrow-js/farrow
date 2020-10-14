import { createCell, Middleware, useCell } from '../core/pipeline'
import { ResponseOutput } from './index'

export const DirnameCell = createCell('')

export const useDirname = () => {
  let dirname = useCell(DirnameCell)
  return dirname
}

export const dirname = (input: string): Middleware<any, ResponseOutput> => {
  return (request, next) => {
    let dirname = useDirname()
    dirname.value = input
    return next(request)
  }
}
