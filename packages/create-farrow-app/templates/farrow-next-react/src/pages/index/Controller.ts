import { Controller } from 'farrow-next'
import { api as GreetApi } from '../../api/greet'

export type IndexState = {
  greet: string
  count: number
}

export class Index extends Controller {
  initialState: IndexState = {
    greet: '',
    count: 0,
  }

  reducers = {
    updateGreet(state: IndexState, greet: string): IndexState {
      return {
        ...state,
        greet,
      }
    },
    incre(state: IndexState, step = 1): IndexState {
      return {
        ...state,
        count: state.count + step,
      }
    },
    decre(state: IndexState, step = 1): IndexState {
      return {
        ...state,
        count: state.count - step,
      }
    },
    setCount(state: IndexState, count: number): IndexState {
      return {
        ...state,
        count,
      }
    },
  }

  /**
   * load ssr state on preload
   */
  async preload() {
    const result = await GreetApi.greet({
      name: `Farrow + Next.js + React`,
    })
    this.actions.updateGreet(result.greet)
  }

  /**
   * sync prev ctrl.state.count on reload
   */
  reload(prevCtrl: this) {
    this.actions.setCount(prevCtrl.state.count)
  }
}
