import { createServerBundlers } from '../bundler/server'
import { createApiClients } from '../api-client'
import { getConfig, GetConfigOptions } from '../config'

export default async function dev(options: GetConfigOptions) {
  const config = await getConfig(options)

  const serversOptions = config.server ? (Array.isArray(config.server) ? config.server : [config.server]) : []

  if (serversOptions.length > 0) {
    const bundlers = serversOptions.map((options) => {
      return {
        env: {
          NODE_ENV: 'development',
        } as NodeJS.ProcessEnv,
        ...options,
      }
    })

    const serverBundlers = createServerBundlers({ bundlers })

    await serverBundlers.start({
      build: true,
      watch: true,
      run: true,
    })
  }

  const apiClientsOptions = config.api ? (Array.isArray(config.api) ? config.api : [config.api]) : []

  if (apiClientsOptions.length > 0) {
    const client = createApiClients({
      services: apiClientsOptions,
    })

    client.start()
  }
}
