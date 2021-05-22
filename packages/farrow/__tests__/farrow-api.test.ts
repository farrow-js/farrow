import shell from 'shelljs'
import { Server } from 'http'
import fs from 'fs/promises'
import { ApiClientOptions, createApiClient } from '../src/api-client'
import Project0 from '../fixtures/project0/src'

const port = Math.floor(3010 + Math.random() * 90)

const tempDir = `${__dirname}/temp`

const apiClientOptions: ApiClientOptions = {
  src: `http://localhost:${port}/api`,
  dist: `${tempDir}/api.ts`,
  logger: false,
}

let server: Server | undefined

describe('Farrow-Api-Client', () => {
  beforeEach(async () => {
    await new Promise<void>((done) => {
      server = Project0.http.listen(port, done)
    })
  })

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
      server = undefined
    })
  })

  it('should generate api-client correctly', async () => {
    const client = createApiClient(apiClientOptions)

    shell.rm('-rf', tempDir)

    expect(shell.test('-d', tempDir)).toBe(false)

    await client.sync()

    expect(shell.test('-d', tempDir)).toBe(true)
    expect(shell.test('-f', apiClientOptions.dist)).toBe(true)

    shell.rm('-rf', tempDir)
  })

  it('should replaceUrl correctly when build', async () => {
    const synClient = createApiClient(apiClientOptions)
    // depend on the correctness of `should generate api-client correctly`
    await synClient.sync()

    const prevSrc = apiClientOptions.src
    const apiClientOptionsForBuild: ApiClientOptions = {
      ...apiClientOptions,
      src: 'http://_#*|*#_myserver.com/api',
    }
    const buildClient = createApiClient(apiClientOptionsForBuild)
    await buildClient.build()

    const content = await fs.readFile(apiClientOptionsForBuild.dist, 'utf-8')
    expect(content).toContain(apiClientOptionsForBuild.src)
    expect(content).not.toContain(prevSrc)
    shell.rm('-rf', tempDir)
  })
})
