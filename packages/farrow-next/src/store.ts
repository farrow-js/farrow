import { createStore as createReduxStore, compose, Store as ReduxStore, PreloadedState, applyMiddleware } from 'redux'

import { createLogger } from 'redux-logger'

import { forcePlainDataCheck } from './util'

export type ReducerWithoutPayload<S = any> = (state: S) => S
export type ReducerWithPayload<S = any, P = any> = (state: S, payload: P) => S
export type ReducerWithOptionalPayload<S = any, P = any> = (state: S, payload?: P) => S

export type Reducer<S = any> = ReducerWithPayload<S> | ReducerWithoutPayload<S> | ReducerWithOptionalPayload<S>

export type Reducers<S = any> = {
  [key: string]: Reducer<S>
}

type AnyFn = (...args: any) => any

export type Actions = {
  [key: string]: AnyFn | Actions
}

export type Tail<T extends any[]> = ((...t: T) => any) extends (_: any, ...tail: infer TT) => any ? TT : []

export type ReducerToAction<R extends Reducer> = R extends (...args: infer Args) => any
  ? (...args: Tail<Args>) => void
  : never

export type ReducersToActions<RS extends Reducers> = {
  [key in keyof RS]: ReducerToAction<RS[key]>
}

export type StateType<T extends ReduxStore> = T extends ReduxStore<infer State> ? State : never

export type CreateStoreOptions<S, RS extends Reducers<S>> = {
  name?: string
  initialState: S
  reducers: RS
  devtools?: boolean
  logger?: boolean
  preloadedState?: PreloadedState<S>
}

export type ActionObject = {
  type: string
  payload?: any
}

export type Store<S = any, RS extends Reducers<S> = Reducers<S>> = ReduxStore<S, ActionObject> & {
  actions: ReducersToActions<RS>
}

const PRELOAD = '@__Preloaded__'

export const createStore = <S, RS extends Reducers<S>>(options: CreateStoreOptions<S, RS>): Store<S, RS> => {
  const { reducers, initialState, preloadedState } = options

  /**
   * check initial state in non-production env
   */
  if (process.env.NODE_ENV !== 'production') {
    forcePlainDataCheck(initialState)
  }

  const reducer = (state: S = initialState, action: ActionObject) => {
    /**
     * check action in non-production env
     */
    if (process.env.NODE_ENV !== 'production') {
      forcePlainDataCheck(action)
    }

    /**
     * replace state via preloaded action
     */
    if (action.type === PRELOAD) {
      return action.payload
    }

    const actionType = action.type

    if (!Object.prototype.hasOwnProperty.call(reducers, actionType)) {
      return state
    }

    const update = reducers[actionType]

    const nextState = update(state, action.payload)

    /**
     * check next state in non-production env
     */
    if (process.env.NODE_ENV !== 'production') {
      forcePlainDataCheck(nextState)
    }

    return nextState
  }

  const enhancer = createReduxDevtoolsEnhancer(options.devtools, options.name, options.logger)

  const store = createReduxStore(reducer, preloadedState, enhancer)

  const actions = createActions(reducers, store.dispatch)

  return {
    ...store,
    actions,
  }
}

export const replaceState = <State>(store: ReduxStore<State>, state: State) => {
  store.dispatch({
    type: PRELOAD,
    payload: state,
  })
}

const createReduxDevtoolsEnhancer = (devtools = true, name?: string, enableLogger = false) => {
  const composeEnhancers =
    // tslint:disable-next-line: strict-type-predicates
    devtools && typeof window === 'object' && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        name,
      })
      : compose

  // @ts-ignore createLogger is not exported
  const enhancer = enableLogger ? composeEnhancers(applyMiddleware(createLogger())) : composeEnhancers()

  return enhancer
}

type Dispatch = (action: ActionObject) => ActionObject

const createActions = <RS extends Reducers>(reducers: RS, dispatch: Dispatch): ReducersToActions<RS> => {
  const actions = {} as ReducersToActions<RS>

  for (const actionType in reducers) {
    const reducer = reducers[actionType]
    const action = ((payload: any) => {
      dispatch({
        type: actionType,
        payload,
      })
    }) as ReducerToAction<typeof reducer>

    actions[actionType] = action
  }

  return actions
}
