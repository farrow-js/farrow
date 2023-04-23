import shell from 'shelljs'
import { Server } from 'http'
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
})
