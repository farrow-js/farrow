import { readdirSync, statSync } from 'fs'
import { join } from 'path'

import sourcemaps from 'rollup-plugin-sourcemaps'

const pkgs = readdirSync(join(__dirname, '..', 'packages'))
  .map((name) => {
    return join(__dirname, '..', 'packages', name)
  })
  .filter((dir) => {
    let stats = statSync(dir)
    return stats.isDirectory() && !require(join(dir, 'package.json')).private
  })

const set = new Set(['http', 'path', 'util', 'fs', 'react-dom/server', 'stream'])

pkgs.forEach((dir) => {
  let pkg = require(join(dir, 'package.json'))
  Object.keys({
    ...pkg.peerDependencies,
    ...pkg.dependencies,
  }).forEach((dep) => set.add(dep))
})

const external = [...set]

export default pkgs.map((dir) => ({
  input: `${dir}/esm/index.js`,
  external,
  plugins: [sourcemaps()],
  output: [
    {
      file: `${dir}/dist/index.js`,
      format: 'cjs',
      sourcemap: true,
    },
  ],
}))
