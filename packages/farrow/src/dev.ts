import { createServerBundlers } from './bundler/server'
import { createApiClients } from './api-client'
import { getConfig, GetConfigOptions } from './config'

export default async function dev(options: GetConfigOptions) {
  let config = await getConfig(options)

  let serversOptions = config.server ? (Array.isArray(config.server) ? config.server : [config.server]) : []

  if (serversOptions.length > 0) {
    let bundlers = serversOptions.map((options) => {
      return {
        env: {
          NODE_ENV: 'development',
        },
        ...options,
      }
    })

    let serverBundlers = createServerBundlers({ bundlers })

    await serverBundlers.start({
      build: true,
      watch: true,
      run: true,
    })
  }

  let apiClientsOptions = config.api ? (Array.isArray(config.api) ? config.api : [config.api]) : []

  if (apiClientsOptions.length > 0) {
    let client = createApiClients({
      services: apiClientsOptions,
    })

    client.start()
  }
}
