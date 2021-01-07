import path from 'path'
import shell from 'shelljs'
import { ChildProcess } from 'child_process'
import { HttpPipeline } from 'farrow-http'
import { Server } from 'http'
import fetch from 'node-fetch'

const projectPath = path.join(__dirname, '../fixtures/project0')

const srcPath = path.join(projectPath, 'src')
const distPath = path.join(projectPath, 'dist')

type ExecResult = {
  code: number
  stdout: string
  stderr: string
  process: ChildProcess
}

const exec = (command: string) => {
  return new Promise<ExecResult>((resolve) => {
    let process = shell.exec(command, (code, stdout, stderr) => {
      resolve({
        code,
        stdout,
        stderr,
        process,
      })
    })
  })
}

let listen = (server: Server, port: number) => {
  return new Promise<string>((resolve) => {
    server.listen(port, () => {
      resolve(`http://localhost:${port}`)
    })
  })
}

let close = (server: Server) => {
  return new Promise<boolean>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
      } else {
        resolve(true)
      }
    })
  })
}

describe('Farrow', () => {
  beforeEach(() => {
    shell.cd(projectPath)
  })

  it('should setup a dev environment', async () => {
    shell.rm('-rf', distPath)

    expect(shell.test('-d', distPath)).toBe(false)

    let result = await exec(`npm run build`)

    expect(result.code).toBe(0)

    expect(shell.test('-d', distPath)).toBe(true)

    // eslint-disable-next-line global-require
    let { server } = require(distPath).default as { http: HttpPipeline; server: Server }

    let base = await listen(server, 3008)

    let response = await fetch(`${base}/user/123`)
    let json = await response.json()

    expect(json).toEqual({
      user: {
        id: 123,
      },
    })

    await close(server)
  })
})
