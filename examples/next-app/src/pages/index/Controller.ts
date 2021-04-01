import { Controller } from 'farrow-next'

export class Index extends Controller {
  preload() {
    console.log('index')
  }
}

export class User extends Controller {}
