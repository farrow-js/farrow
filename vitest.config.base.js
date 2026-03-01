const fs = require('fs')
const path = require('path')

const packagesDir = path.join(__dirname, 'packages')
const workspaceAliases = []

for (const dir of fs.readdirSync(packagesDir)) {
  const pkgDir = path.join(packagesDir, dir)
  const pkgJsonPath = path.join(pkgDir, 'package.json')

  if (!fs.existsSync(pkgJsonPath)) continue

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
  if (!pkg.name) continue

  const srcIndex = path.join(pkgDir, 'src', 'index.ts')
  const srcDir = path.join(pkgDir, 'src')

  if (fs.existsSync(srcDir)) {
    workspaceAliases.push({
      find: new RegExp(`^${pkg.name}/dist/(.*)$`),
      replacement: `${srcDir}/$1`,
    })
    workspaceAliases.push({
      find: new RegExp(`^${pkg.name}/(.*)\\.node$`),
      replacement: `${srcDir}/$1/node.ts`,
    })
    workspaceAliases.push({
      find: new RegExp(`^${pkg.name}/(.*)\\.browser$`),
      replacement: `${srcDir}/$1/browser.ts`,
    })
    workspaceAliases.push({
      find: new RegExp(`^${pkg.name}/(.*)$`),
      replacement: `${srcDir}/$1`,
    })
  }

  if (fs.existsSync(srcIndex)) {
    workspaceAliases.push({ find: pkg.name, replacement: srcIndex })
  } else if (fs.existsSync(srcDir)) {
    workspaceAliases.push({ find: pkg.name, replacement: srcDir })
  }
}

module.exports = {
  cache: {
    dir: path.join(__dirname, 'node_modules/.vitest-cache'),
  },
  resolve: {
    alias: workspaceAliases,
  },
  test: {
    globals: true,
    setupFiles: [path.join(__dirname, 'vitest.setup.ts')],
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx,js,jsx}', '**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['**/node_modules/**', '**/examples/**'],
    coverage: {
      provider: 'v8',
      exclude: ['**/examples/**', '**/node_modules/**', '**/__tests__/**'],
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95,
      },
      include: ['src/**/*.{ts,tsx}'],
    },
  },
}
