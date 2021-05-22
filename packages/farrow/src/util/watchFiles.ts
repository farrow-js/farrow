import chokidar from 'chokidar'

export const watchFiles = (
  paths: string | readonly string[],
  options?: chokidar.WatchOptions,
): Promise<chokidar.FSWatcher> => {
  return new Promise((resolve, reject) => {
    const watcher = chokidar
      .watch(paths, options)
      .on('ready', () => {
        resolve(watcher)
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}
