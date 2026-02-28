import type { Config } from './config'

export type { Config }

export const defineConfig = (config: Config) => {
  return config
}

// compatibility
export const createFarrowConfig = (config: Config) => {
  return config
}
