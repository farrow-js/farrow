import { cosmiconfig } from 'cosmiconfig'
import { ServerBundlerOptions } from './bundler/server'
import { ApiClientOptions } from './api-client'

export const explorer = cosmiconfig('farrow')

export type Config = {
  server?: ServerBundlerOptions | ServerBundlerOptions[] | false
  api?: ApiClientOptions | ApiClientOptions[] | false
}

export type GetConfigOptions = {
  config?: string
}

export const getConfig = async (options: GetConfigOptions = {}) => {
  const result = await (options.config ? explorer.load(options.config) : explorer.search())

  const config = {
    server: {},
    ...result?.config,
  } as Config

  return config
}
