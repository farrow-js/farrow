import path from 'path'
import { Http } from 'farrow-http'
import { router as api } from './api'
import { router as pages } from './pages'
import { Action2Api } from './middleware/Action2Page'

const http = Http({
  basenames: ['/base'],
})

http.use(pages)

// rewrite /action/... to /api/...
// and redirect to home page
http.use(Action2Api('/'))

http.serve('/static', path.join(__dirname, '../static'))

http.route('/api').use(api)

http.listen(3002, () => {
  console.log(`server started at http://localhost:3002`)
})
