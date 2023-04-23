import { createServerBundlers } from '../bundler/server'
import { getConfig, GetConfigOptions } from '../config'

export default async function build(options: GetConfigOptions) {
  const config = await getConfig(options)

  const serversOptions = config.server ? (Array.isArray(config.server) ? config.server : [config.server]) : []

  if (serversOptions.length > 0) {
    const bundlers = serversOptions.map((options) => {
      return {
        minify: true,
        env: {
          NODE_ENV: 'production',
        } as NodeJS.ProcessEnv,
        ...options,
      }
    })
    const serverBundlers = createServerBundlers({ bundlers })

    await serverBundlers.start({
      build: true,
    })
  }
}
