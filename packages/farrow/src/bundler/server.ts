import path from 'path'
import execa, { ExecaChildProcess } from 'execa'
import { Plugin, startService, BuildOptions } from 'esbuild'
import slash from 'slash'
import fs from 'fs/promises'
import readPkgUp from 'read-pkg-up'

import { watchFiles } from '../util/watchFiles'
import { join } from '../util/join'
import { memo } from '../util/memo'

export type BundlerOptions = {
  /**
   * auto add closest package.json dependenties to esbuild external or not
   */
  autoAddExternal?: boolean
  build: BuildOptions
}

const mergeList = <T>(...args: (undefined | T[])[]): T[] => {
  let list = args.filter(Boolean) as T[][]
  return ([] as T[]).concat(...list)
}

const safeGetKeys = (input: object | undefined): string[] => {
  if (!input) return []
  return Object.keys(input)
}

export const createBundler = (options: BundlerOptions) => {
  let config = {
    autoAddExternal: true,
    ...options,
  }

  let getService = memo(() => {
    return startService()
  })

  let getBuilder = memo(async () => {
    let service = await getService()
    let pkgResult = await readPkgUp({
      cwd: config.build.entryPoints?.[0],
    })
    let external = config.autoAddExternal
      ? mergeList(
          config.build.external,
          safeGetKeys(pkgResult?.packageJson?.devDependencies),
          safeGetKeys(pkgResult?.packageJson?.dependencies),
          safeGetKeys(pkgResult?.packageJson?.peerDependencies),
        )
      : config.build.external

    let result = await service.build({
      ...config.build,
      external,
      incremental: true,
    })
    return result.rebuild
  })

  let hasBuilt = false
  let build = async () => {
    hasBuilt = true
    let builder = await getBuilder()
    return builder()
  }

  let dispose = async () => {
    if (hasBuilt) {
      let builder = await getBuilder()
      let service = await getService()

      builder.dispose()
      service.stop()
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
   * auto add closest package.json dependenties to esbuild external or not
   */
  autoAddExternal?: boolean
}

export type StartOptions = {
  build?: boolean
  watch?: boolean
  run?: boolean
}

export const createServerBundler = (options: ServerBundlerOptions = {}) => {
  let config = {
    entry: 'index.ts',
    src: 'src',
    dist: 'dist',
    nodeArgs: [],
    autoAddExternal: true,
    ...options,
    esbuild: {
      sourcemap: true,
      keepNames: true,
      ...options.esbuild,
    },
  }
  let srcEntry = join(config.src, config.entry)
  let distEntry = join(config.dist, config.entry).replace(/\.(tsx?)$/, '.js')
  let bundler = createBundler({
    autoAddExternal: config.autoAddExternal,
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

  let run = () => {
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

  let cancel = () => {
    if (childProcess) {
      childProcess.cancel()
      childProcess = null
    }
  }

  let hasWatcher = false
  let getWatcher = memo(async () => {
    hasWatcher = true

    let watcher = await watchFiles('.', {
      cwd: config.src,
      usePolling: true,
    })

    watcher.on('all', async () => {
      try {
        await build()
        run()
      } catch (error) {
        console.log('watcher:', error.stack)
      }
    })

    return watcher
  })

  let watch = async () => {
    await getWatcher()
  }

  let build = async () => {
    let start = Date.now()
    console.log('start build')
    await bundler.build()
    console.log(`finish build in ${(Date.now() - start).toFixed(2)}ms`)
  }

  let isStarted = false

  let start = async (startOptions?: StartOptions) => {
    if (isStarted) {
      await stop()
    }

    // eslint-disable-next-line require-atomic-updates
    isStarted = true

    let startConfig = {
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

  let stop = async () => {
    cancel()
    await bundler.dispose()
    if (hasWatcher) {
      let watcher = await getWatcher()
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
  let bundlers = options.bundlers.map(createServerBundler)

  let start = async (startOptions?: StartOptions) => {
    let promises = bundlers.map((bundler) => bundler.start(startOptions))
    await Promise.all(promises)
  }

  let stop = async () => {
    let promises = bundlers.map((bundler) => bundler.stop())
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
          let content = (await fs.readFile(args.path)).toString()
          let dirname = path.dirname(args.path)
          let relative = path.relative(dist, dirname)
          let extname = path.extname(args.path)
          return {
            contents: content.replace(/__dirname/g, `require('path').join(__dirname, "${slash(relative)}")`),
            loader: extname.slice(1) as 'ts' | 'tsx' | 'js' | 'jsx',
          }
        },
      )
    },
  }
}
