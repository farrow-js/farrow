import path from 'path'
import slash from './slash'

export const join = (...args: Parameters<typeof path.join>): ReturnType<typeof path.join> => {
  return slash(path.join(...args))
}
