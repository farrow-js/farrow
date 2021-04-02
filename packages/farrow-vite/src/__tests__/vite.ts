import { Http } from 'farrow-http'
import request from 'supertest'
import { vite } from '../vite'

const createHttp = () => {
  return Http({
    logger: false,
  })
}

const http = createHttp()

const server = http.server()

const viteRouter = vite({ root: __dirname })

http.use(viteRouter)

describe('Farrow-Vite', () => {
  afterAll(async () => {
    await viteRouter.close()
  })

  it('should match root when exact /', async () => {
    await request(server)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(
        200,
        '<!DOCTYPE html>\n' +
          '<script type="module" src="/@vite/client"></script>\n' +
          '<html lang="en">\n' +
          '  <body></body>\n' +
          '</html>\n',
      )
  })

  it("should match root when can't find html", async () => {
    await request(server)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(
        200,
        '<!DOCTYPE html>\n' +
          '<script type="module" src="/@vite/client"></script>\n' +
          '<html lang="en">\n' +
          '  <body></body>\n' +
          '</html>\n',
      )
  })
  it('should match sub folder html', async () => {
    await request(server)
      .get('/sub')
      .expect('Content-Type', /html/)
      .expect(
        200,
        '<!DOCTYPE html>\n' +
          '<script type="module" src="/@vite/client"></script>\n' +
          '<html lang="en">\n' +
          '  <body>\n' +
          '    sub\n' +
          '  </body>\n' +
          '</html>\n',
      )
  })
})
