import { createServerBundler, createServerBundlers } from '../bundler/server'
import { getConfig, GetConfigOptions } from '../config'

export default async function start(options: GetConfigOptions) {
  const config = await getConfig(options)

  const serversOptions = config.server ? (Array.isArray(config.server) ? config.server : [config.server]) : []

  if (serversOptions.length > 0) {
    const bundlers = serversOptions.map((options) => {
      return {
        env: {
          NODE_ENV: 'production',
        } as NodeJS.ProcessEnv,
        ...options,
      }
    })
    const serverBundlers = createServerBundlers({ bundlers })

    await serverBundlers.start({
      run: true,
    })
  }
}
