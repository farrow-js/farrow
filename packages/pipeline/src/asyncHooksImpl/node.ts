import NodeAsyncHooks from 'async_hooks'
import * as asyncHooksInterface from '../asyncHooksInterface'

const createAsyncHooks = <T>() => {
  let store = new Map<number, T>()

  let hooks = NodeAsyncHooks.createHook({
    init: (asyncId, _, triggerAsyncId) => {
      if (store.has(triggerAsyncId)) {
        let value = store.get(triggerAsyncId)
        if (value) {
          store.set(asyncId, value)
        }
      }
    },
    destroy: (asyncId) => {
      if (store.has(asyncId)) {
        store.delete(asyncId)
      }
    },
  })

  let set = (value: T) => {
    store.set(NodeAsyncHooks.executionAsyncId(), value)
  }

  let get = () => {
    return store.get(NodeAsyncHooks.executionAsyncId())
  }

  let clear = () => {
    store.clear()
  }

  let enable = () => {
    hooks.enable()
  }

  let disable = () => {
    hooks.disable()
    store.clear()
  }

  let entries = () => {
    return store.entries()
  }

  return {
    enable,
    disable,
    set,
    get,
    clear,
    entries,
  }
}

export const enable = () => {
  let hooks = createAsyncHooks<asyncHooksInterface.Hooks>()
  disable()
  asyncHooksInterface.impl(hooks)
  hooks.enable()
}

export const disable = () => {
  asyncHooksInterface.asyncHooks?.disable()
  asyncHooksInterface.reset()
}
