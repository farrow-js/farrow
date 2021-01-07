import { cosmiconfig } from 'cosmiconfig'
import { ServerBundlerOptions } from './bundler/server'

export const explorer = cosmiconfig('farrow')

export type Config = {
  server?: ServerBundlerOptions
}

export type GetConfigOptions = {
  config?: string
}

export const getConfig = async (options: GetConfigOptions = {}) => {
  let result = await (options.config ? explorer.load(options.config) : explorer.search())

  let config = {
    ...result?.config,
  } as Config

  return config
}
