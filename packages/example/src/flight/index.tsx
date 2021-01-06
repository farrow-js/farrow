import { Router, Response } from 'farrow-http'
import path from 'path'

export const router = Router()

router.serve('/static/react', path.join(__dirname, '../../node_modules/react'))
router.serve('/static/react-dom', path.join(__dirname, '../../node_modules/react-dom'))
router.serve('/static/react-server-dom-webpack', path.join(__dirname, '../../node_modules/react-server-dom-webpack'))

router.get('/src/<filename:string>').use(async (request) => {
  let filename = path.join(__dirname, 'src', request.params.filename)
  return Response.type('js').file(filename)
})

router.get('/').use(() => {
  return Response.file(path.join(__dirname, 'index.html'))
})
