import { createServerBundler } from './bundler/server'
import { createApiClients } from './api-client'
import { getConfig, GetConfigOptions } from './config'

export default async function dev(options: GetConfigOptions) {
  let config = await getConfig(options)

  if (config.api) {
    let client = createApiClients(config.api)

    client.start()
  }

  if (config.server) {
    let serverBundler = createServerBundler({
      env: {
        NODE_ENV: 'development',
      },
      ...config.server,
    })

    await serverBundler.start({
      build: true,
      watch: true,
      run: true,
    })
  }
}
