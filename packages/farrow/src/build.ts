import { createServerBundler, createServerBundlers } from './bundler/server'
import { getConfig, GetConfigOptions } from './config'
import { createApiClients } from './api-client'

export default async function build(options: GetConfigOptions) {
  let config = await getConfig(options)

  let serversOptions = config.server ? (Array.isArray(config.server) ? config.server : [config.server]) : []

  if (serversOptions.length > 0) {
    let bundlers = serversOptions.map((options) => {
      return {
        minify: true,
        env: {
          NODE_ENV: 'production',
        },
        ...options,
      }
    })
    let serverBundlers = createServerBundlers({ bundlers })

    await serverBundlers.start({
      build: true,
    })
  }

  let clientsOptions = config.api ? (Array.isArray(config.api) ? config.api : [config.api]) : []
  let apiClients = createApiClients({ services: clientsOptions })
  await apiClients.build()
}
