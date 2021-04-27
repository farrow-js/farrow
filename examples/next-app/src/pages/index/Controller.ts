import { Controller } from 'farrow-next'

export class Index extends Controller {
  user = this.use(User)
  preload() {
    console.log('index')
  }
}

export class User extends Controller {
  get index() {
    return this.use(Index)
  }
}
