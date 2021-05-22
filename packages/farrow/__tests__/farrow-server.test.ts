import path from 'path'
import shell from 'shelljs'
import { ChildProcess } from 'child_process'
import { HttpPipeline } from 'farrow-http'
import { Server } from 'http'
import request from 'supertest'

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
    const process = shell.exec(command, (code, stdout, stderr) => {
      resolve({
        code,
        stdout,
        stderr,
        process,
      })
    })
  })
}

describe('Farrow', () => {
  beforeEach(() => {
    shell.cd(projectPath)
  })

  it('should build and run a server', async () => {
    shell.rm('-rf', distPath)

    expect(shell.test('-d', distPath)).toBe(false)

    const result = await exec(`npm run build`)

    expect(result.code).toBe(0)

    expect(shell.test('-d', distPath)).toBe(true)

    const { server } = require(distPath).default as { http: HttpPipeline; server: Server }

    await request(server)
      .get('/user/123')
      .expect(200, {
        user: {
          id: 123,
        },
      })

    await request(server).get('/env/NODE_ENV').expect(200, {
      NODE_ENV: 'test',
    })
  })
})
