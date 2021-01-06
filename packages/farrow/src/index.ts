import path from 'path'
import chokidar from 'chokidar'
import execa, { ExecaChildProcess } from 'execa'
import { Plugin, startService, Service, ServiceOptions, BuildOptions, BuildIncremental } from 'esbuild'
import slash from 'slash'
import fs from 'fs/promises'

const join = (...args: Parameters<typeof path.join>): ReturnType<typeof path.join> => {
  return slash(path.join(...args))
}

const watchFiles = (
  paths: string | readonly string[],
  options?: chokidar.WatchOptions,
): Promise<chokidar.FSWatcher> => {
  return new Promise((resolve, reject) => {
    let watcher = chokidar
      .watch(paths, options)
      .on('ready', () => {
        resolve(watcher)
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}
function memo<T>(f: () => T): typeof f
function memo<T>(f: () => Promise<T>): typeof f
function memo(f: () => any): any {
  let result: any = null

  return () => {
    if (result) return result
    result = f()
    return result
  }
}

export type BundlerOptions = {
  build: BuildOptions
}

export const createBundler = (options: BundlerOptions) => {
  let getService = memo(() => {
    return startService()
  })
  let getBuilder = memo(async () => {
    let service = await getService()
    let result = await service.build({
      ...options.build,
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
  entry?: string
  src?: string
  dist?: string
  external: BuildOptions['external']
  metafile: BuildOptions['metafile']
  loader: BuildOptions['loader']
  tsconfig: BuildOptions['tsconfig']
  publicPath: BuildOptions['publicPath']
  inject: BuildOptions['inject']
  plugins: BuildOptions['plugins']
  sourcemap: BuildOptions['sourcemap']
}

export const createServerBundler = (options: ServerBundlerOptions) => {
  let isProduction = process.env.NODE_ENV === 'production'
  let config = {
    entry: 'index',
    src: 'src',
    dist: 'dist',
    watch: !isProduction,
    ...options,
  }
  let srcEntry = join(config.src, config.entry)
  let distEntry = join(config.dist, config.entry).replace(/\.(tsx?)$/, '.js')
  let bundler = createBundler({
    build: {
      platform: 'node',
      bundle: true,
      entryPoints: [srcEntry],
      outbase: config.src,
      outdir: config.dist,
      metafile: config.metafile,
      loader: config.loader,
      tsconfig: config.tsconfig,
      publicPath: config.publicPath,
      inject: config.inject,
      plugins: [...(config.plugins ?? []), createResolveDirnamePlugin(config.dist)],
      external: config.external,
      sourcemap: config.sourcemap ?? (isProduction ? 'external' : undefined),
    },
  })

  let childProcess: ExecaChildProcess | null

  let run = () => {
    stop()
    childProcess = execa('node', [distEntry], {
      stdout: 'inherit',
      stderr: 'inherit',
    })
    return childProcess
  }

  let stop = () => {
    if (childProcess) {
      childProcess.cancel()
      // childProcess.kill('SIGTERM', {
      //   forceKillAfterTimeout: 2000,
      // })
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
        await run()
      } catch (error) {
        if (error?.stack.includes('Command was canceled')) {
          return
        }
        console.log('watcher:', error.stack)
      }
    })

    return watcher
  })

  let watch = async () => {
    await getWatcher()
  }

  let build = async () => {
    await bundler.build()
  }

  type StartOptions = {
    build?: boolean
    watch?: boolean
    run?: boolean
  }

  let isStarted = false

  let start = async (startOptions?: StartOptions) => {
    if (isStarted) return
    isStarted = true

    let startConfig = {
      build: true,
      watch: true,
      run: true,
      ...startOptions,
    }

    try {
      if (startConfig.build) {
        console.log('start build')
        await build()
        console.log('finish build')
      }

      if (startConfig.watch) {
        console.log('start watch')
        await watch()
      }

      if (startConfig.run) {
        console.log('start run')
        await run()
      }
    } catch (error) {
      if (error?.stack.includes('Command was canceled')) {
        return
      }
      console.log('start:', error.stack)
    }
  }

  let dispose = async () => {
    stop()
    await bundler.dispose()
    if (hasWatcher) {
      let watcher = await getWatcher()
      await watcher.close()
    }
  }

  return {
    start,
    watch,
    build,
    run,
    dispose,
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
