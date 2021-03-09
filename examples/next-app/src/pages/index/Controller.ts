import { Controller } from 'farrow-next'
import { ApiCtrl } from '../../controllers/Api'

export class Index extends Controller {
  api = this.use(ApiCtrl)
}

export class User extends Controller {
  api = this.use(ApiCtrl)
}
