import { createServerBundler } from './bundler/server'
import { getConfig, GetConfigOptions } from './config'

export default async function dev(options: GetConfigOptions) {
  let config = await getConfig(options)

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
