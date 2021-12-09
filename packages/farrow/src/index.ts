import { Config } from './config'

export { Config }

export const defineConfig = (config: Config) => {
  return config
}

// compatibility
export const createFarrowConfig = (config: Config) => {
  return config
}
