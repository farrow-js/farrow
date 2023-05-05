import path from 'path'
import execa, { ExecaChildProcess } from 'execa'
import { Plugin, BuildOptions } from 'esbuild'
import * as esbuild from 'esbuild'
import slash from '../util/slash'
import fs from 'fs/promises'
import readPkgUp from 'read-pkg-up'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

import { watchFiles } from '../util/watchFiles'
import { join } from '../util/join'
import { memo } from '../util/memo'

export type BundlerOptions = {
  /**
   * auto add closest package.json dependencies to esbuild external or not
   */
  autoAddExternal?: boolean
  build: BuildOptions
}

const mergeList = <T>(...args: (undefined | T[])[]): T[] => {
  const list = args.filter(Boolean) as T[][]
  return ([] as T[]).concat(...list)
}

const safeGetKeys = (input: object | undefined): string[] => {
  if (!input) return []
  return Object.keys(input)
}

export const createBundler = (options: BundlerOptions) => {
  const config = {
    autoAddExternal: true,
    ...options,
  }

  const getBuilder = memo(async () => {
    const pkgResult = await readPkgUp({
      cwd: config.build.entryPoints?.[0],
    })
    const external = config.autoAddExternal
      ? mergeList(
          config.build.external,
          safeGetKeys(pkgResult?.packageJson?.devDependencies),
          safeGetKeys(pkgResult?.packageJson?.dependencies),
          safeGetKeys(pkgResult?.packageJson?.peerDependencies),
          safeGetKeys(pkgResult?.packageJson?.optionalDependencies),
        )
      : config.build.external

    const plugins = config.autoAddExternal
      ? [...(config.build.plugins ?? []), nodeExternalsPlugin()]
      : config.build.plugins ?? []

    const result = await esbuild.build({
      ...config.build,
      external,
      plugins,
      incremental: true,
    })
    return result.rebuild
  })

  let hasBuilt = false
  const build = async () => {
    hasBuilt = true
    const builder = await getBuilder()
    return builder()
  }

  const dispose = async () => {
    if (hasBuilt) {
      const builder = await getBuilder()

      builder.dispose()
    }
  }

  return {
    build,
    dispose,
  }
}

export type ServerBundlerOptions = {
  /**
   * filename of entry
   */
  entry?: string
  /**
   * folder of source code
   */
  src?: string
  /**
   * folder of output code
   */
  dist?: string
  /**
   * - args for node.js
   * - eg. ['--inspect-brk'] for debugging
   */
  nodeArgs?: string[]
  /**
   * - env for node.js
   * - eg. { NODE_ENV: 'production' }
   * - NODE_ENV = production in `farrow start`
   * - NODE_ENV = development in `farrow dev`
   */
  env?: NodeJS.ProcessEnv
  /**
   * other options for esbuild
   */
  esbuild?: Omit<BuildOptions, 'entryPoints' | 'outdir' | 'outbase'>
  /**
   * alias of autoExternal
   * auto add closest package.json dependenties to esbuild external or not
   */
  autoAddExternal?: boolean
  /**
   * auto add closest package.json dependenties to esbuild external or not
   */
  autoExternal?: boolean
}

export type StartOptions = {
  build?: boolean
  watch?: boolean
  run?: boolean
}

export const createServerBundler = (options: ServerBundlerOptions = {}) => {
  const config = {
    entry: 'index.ts',
    src: 'src',
    dist: 'dist',
    nodeArgs: [],
    ...options,
    esbuild: {
      sourcemap: true,
      keepNames: true,
      ...options.esbuild,
    },
  }
  const srcEntry = join(config.src, config.entry)
  const distEntry = join(config.dist, config.entry).replace(/\.(tsx?)$/, '.js')
  const bundler = createBundler({
    autoAddExternal: config.autoExternal ?? config.autoAddExternal ?? true,
    build: {
      ...config.esbuild,
      platform: 'node',
      bundle: true,
      entryPoints: [srcEntry],
      outbase: config.src,
      outdir: config.dist,
      plugins: [...(config.esbuild.plugins ?? []), createResolveDirnamePlugin(config.dist)],
    },
  })

  let childProcess: ExecaChildProcess | null

  const run = () => {
    cancel()
    childProcess = execa('node', [...config.nodeArgs, distEntry], {
      stdout: 'inherit',
      stderr: 'inherit',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        ...config.env,
      },
    })
    childProcess.catch((error) => {
      if (error.isCanceled) return
      throw error
    })
  }

  const cancel = () => {
    if (childProcess) {
      childProcess.cancel()
      childProcess = null
    }
  }

  let hasWatcher = false
  const getWatcher = memo(async () => {
    hasWatcher = true

    const watcher = await watchFiles('.', {
      cwd: config.src,
      usePolling: true,
    })

    watcher.on('all', async () => {
      try {
        await build()
        run()
      } catch (error: any) {
        console.log('watcher:', error.stack)
      }
    })

    return watcher
  })

  const watch = async () => {
    await getWatcher()
  }

  const build = async () => {
    const start = Date.now()
    console.log('start build')
    await bundler.build()
    console.log(`finish build in ${(Date.now() - start).toFixed(2)}ms`)
  }

  let isStarted = false

  const start = async (startOptions?: StartOptions) => {
    if (isStarted) {
      await stop()
    }

    // eslint-disable-next-line require-atomic-updates
    isStarted = true

    const startConfig = {
      ...startOptions,
    }

    if (startConfig.build) {
      await build()
    }

    if (startConfig.watch) {
      await watch()
    }

    if (startConfig.run) {
      run()
    }

    if (!startConfig.run && !startConfig.watch) {
      await stop()
    }
  }

  const stop = async () => {
    cancel()
    await bundler.dispose()
    if (hasWatcher) {
      const watcher = await getWatcher()
      await watcher.close()
    }
    isStarted = false
  }

  return {
    start,
    stop,
  }
}

export type ServerBundlersOptions = {
  bundlers: ServerBundlerOptions[]
}

export const createServerBundlers = (options: ServerBundlersOptions) => {
  const bundlers = options.bundlers.map(createServerBundler)

  const start = async (startOptions?: StartOptions) => {
    const promises = bundlers.map((bundler) => bundler.start(startOptions))
    await Promise.all(promises)
  }

  const stop = async () => {
    const promises = bundlers.map((bundler) => bundler.stop())
    await Promise.all(promises)
  }

  return {
    start,
    stop,
  }
}

const createResolveDirnamePlugin = (dist: string): Plugin => {
  return {
    name: 'farrow.resolve.dirname',
    setup: (build) => {
      build.onLoad(
        {
          filter: /.*\.(j|t)sx?$/,
        },
        async (args) => {
          const content = (await fs.readFile(args.path)).toString()
          const dirname = path.dirname(args.path)
          const relative = path.relative(dist, dirname)
          const extname = path.extname(args.path)
          return {
            contents: content.replace(/__dirname/g, `require('path').join(__dirname, "${slash(relative)}")`),
            loader: extname.slice(1) as 'ts' | 'tsx' | 'js' | 'jsx',
          }
        },
      )
    },
  }
}
