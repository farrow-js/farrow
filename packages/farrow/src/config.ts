import { cosmiconfig } from 'cosmiconfig'
import { ServerBundlerOptions } from './bundler/server'
import { CreateApiClientsOptions } from './api-client'

export const explorer = cosmiconfig('farrow')

export type Config = {
  server?: ServerBundlerOptions | false
  api?: CreateApiClientsOptions | false
}

export type GetConfigOptions = {
  config?: string
}

export const getConfig = async (options: GetConfigOptions = {}) => {
  let result = await (options.config ? explorer.load(options.config) : explorer.search())

  let config = {
    server: {},
    ...result?.config,
  } as Config

  return config
}
