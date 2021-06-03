import 'isomorphic-unfetch'
import React, { useContext, useReducer, useRef } from 'react'
import Router from 'next/router'
import { CookieSerializeOptions } from 'cookie'
import { stringify as stringifyQuery } from 'qs'
import { StateType, Store, Reducers, createStore } from './store'
import { identity, shallowEqual } from './util'
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect'
import { Module, ModuleCtor } from './module'
import * as Cookie from './cookie'
import { GetPageInfo } from './page-info'
import type { IncomingMessage } from 'http'

export type ControllerCtor<T extends Controller = Controller> = ModuleCtor<T> & typeof Controller

export type ControllerCtors = {
  [key: string]: ControllerCtor
}

export type ControllerInstancesType<T extends ControllerCtors = {}> = {
  [key in keyof T]: InstanceType<T[key]>
}

let uid = 0
const ControllerIdWeakMap = new WeakMap<ControllerCtor, number>()

/**
 * a storage to save all controllers for react context
 */
export type ControllerReactContextValue = {
  [key: string]: Controller
}

export const ControllerReactContext = React.createContext<ControllerReactContextValue | null>(null)

const DefaultValue = Symbol('default-value')

type DefaultValueType = typeof DefaultValue

/**
 * mapping ctrl to store
 */
const StoreWeakMap = new WeakMap<Controller, Store>()

const getControllerStore = <T extends Controller>(ctrl: T): Store<T['initialState'], T['reducers']> => {
  /**
   * store of controller
   * create store via initialState/reducers
   */
  if (StoreWeakMap.has(ctrl)) {
    return StoreWeakMap.get(ctrl)!
  }

  const store = createStore({
    name: typeof ctrl.devtools === 'string' ? ctrl.devtools : ctrl.constructor.name,
    initialState: ctrl.initialState,
    reducers: ctrl.reducers,
    devtools: !!ctrl.devtools,
    logger: ctrl.logger,
  })

  StoreWeakMap.set(ctrl, store)
  return store
}

export abstract class Controller extends Module {
  /**
   *
   * @param this Controller
   * @returns ReactContext for Controller
   */
  static getId<T extends Controller>(this: ControllerCtor<T>): number {
    if (ControllerIdWeakMap.has(this)) {
      return ControllerIdWeakMap.get(this)!
    }

    const id = uid

    uid += 1

    ControllerIdWeakMap.set(this, id)

    return id
  }

  /**
   *
   * @param this Controller
   * @returns get Controller instance via react-hooks
   */
  static use<T extends Controller>(this: ControllerCtor<T>): T {
    const id = this.getId()
    const ctx = useContext(ControllerReactContext)

    const ctrl = ctx ? ctx[`${id}`] : null

    if (!ctrl) {
      throw new Error('You may forget to add Controller to page({ Controllers: {} }) before using Controller.use()')
    }

    return ctrl as T
  }

  /**
   *
   * @param this Controller
   * @param selector a function for selecting state
   * @param compare a function for comparing curr state and prev state
   * @returns selected state
   */
  static useState<T extends Controller, TSelected = StateType<T['store']>>(
    this: ControllerCtor<T>,
    selector?: (state: StateType<T['store']>) => TSelected,
    compare?: (curr: TSelected, prev: TSelected) => boolean,
  ) {
    selector = selector ?? identity
    compare = compare ?? shallowEqual

    const ctrl = this.use()

    type State = StateType<T['store']>
    type Selector = typeof selector
    type SelectedState = ReturnType<Selector>

    const { store } = ctrl

    // modified from react-redux useSelector
    const [_, forceRender] = useReducer((s) => s + 1, 0)

    const latestSubscriptionCallbackError = useRef<Error | null>(null)
    const latestSelector = useRef<Selector | undefined>()
    const latestStoreState = useRef<State | DefaultValueType>(DefaultValue)
    const latestSelectedState = useRef<SelectedState | DefaultValueType>(DefaultValue)

    const storeState = store.getState()
    let selectedState: SelectedState | DefaultValueType = DefaultValue

    try {
      if (
        selector !== latestSelector.current ||
        storeState !== latestStoreState.current ||
        latestSubscriptionCallbackError.current
      ) {
        const currentSelectedState = selector(storeState)
        if (
          latestSelectedState.current !== DefaultValue &&
          compare(currentSelectedState, latestSelectedState.current)
        ) {
          selectedState = latestSelectedState.current
        } else {
          selectedState = currentSelectedState
        }
      } else {
        selectedState = latestSelectedState.current
      }
    } catch (err) {
      if (latestSubscriptionCallbackError.current) {
        err.message += `\nThe error may be correlated with this previous error:\n${latestSubscriptionCallbackError.current.stack}\n\n`
      }

      throw err
    }

    useIsomorphicLayoutEffect(() => {
      latestSelector.current = selector
      latestStoreState.current = storeState
      latestSelectedState.current = selectedState
      latestSubscriptionCallbackError.current = null
    })

    useIsomorphicLayoutEffect(() => {
      let isUnmounted = false
      const checkForUpdates = () => {
        if (!latestSelector.current) return
        if (isUnmounted) return

        if (latestSelectedState.current === DefaultValue) {
          throw new Error('latestSelectedState should not be default value')
        }

        try {
          const storeState = store.getState()
          const newSelectedState = latestSelector.current(storeState)

          if (compare!(newSelectedState, latestSelectedState.current)) {
            return
          }

          latestSelectedState.current = newSelectedState
          latestStoreState.current = storeState
        } catch (err) {
          // we ignore all errors here, since when the component
          // is re-rendered, the selectors are called again, and
          // will throw again, if neither props nor store state
          // changed
          latestSubscriptionCallbackError.current = err
        }

        forceRender()
      }
      const unsubscribe = store.subscribe(checkForUpdates)

      return () => {
        isUnmounted = true
        unsubscribe()
      }
    }, [store])

    if (selectedState === DefaultValue) {
      throw new Error('selectedState should not be default value')
    }

    return selectedState
  }

  /**
   * initial state
   */
  initialState?: any

  /**
   * reducers for updating state
   */
  reducers: Reducers<this['initialState']> = {}

  /**
   * enable redux-devtools
   */
  devtools: boolean | string = true

  /**
   * enable redux-logger
   */
  logger = false

  /**
   * store of controller
   */
  get store() {
    return getControllerStore(this)
  }

  /**
   * actions of controller store
   */
  get actions() {
    return this.store.actions
  }

  /**
   * state of current controller store
   */
  get state() {
    return this.store.getState()
  }

  /**
   * preload state for SSR
   */
  preload?(): Promise<void> | void

  /**
   *
   * @param ctrl
   * when query-changed controller will be re-created
   * reload(ctrl) received the previous controller
   */
  reload?(prevCtrl: this): unknown

  /**
   * page info
   */
  get page() {
    const getPageInfo = this.use(GetPageInfo)
    return getPageInfo()
  }

  /**
   * get cookie without caring whether in server or client
   * @param name
   */
  getCookie(name: string) {
    return Cookie.get(name, this.page.req)
  }

  /**
   * set cookie without caring whether in server or client
   * @param name
   * @param value
   * @param options
   */
  setCookie(name: string, value: string, options?: CookieSerializeOptions) {
    return Cookie.set(name, value, options, this.page.res)
  }

  /**
   * remove cookie without caring whether in server or client
   * @param name
   * @param options
   */
  removeCookie(name: string, options?: CookieSerializeOptions) {
    return Cookie.remove(name, options, this.page.res)
  }

  /**
   * get userAgent without caring whether in server or client
   */
  get userAgent() {
    if (this.page.userAgent) {
      return this.page.userAgent
    }
    return getUserAgent(this.page.req)
  }

  /**
   * is server?
   */
  get isServer() {
    return !!this.page.req
  }

  /**
   * is client?
   */
  get isClient() {
    return !this.page.req
  }

  /**
   * fetch data without caring passing cookie
   * @param url request url
   * @param options request options
   * @returns response
   */
  fetch(url: string, options?: RequestInit): ReturnType<typeof fetch> {
    options = {
      credentials: 'include',
      ...options,
    }

    /**
     * add cookie in server side
     */
    if (this.page.req && options.credentials === 'include') {
      options.headers = {
        ...options.headers,
        Cookie: this.page.req.headers.cookie || '',
      }
    }

    return fetch(url, options)
  }

  /**
   *
   * @param url request url
   * @param query query object
   * @param init request options
   * @returns json
   */
  async getJson<Query extends {}>(url: string, query?: Query, init?: RequestInit) {
    const options: RequestInit = {
      ...init,
      method: 'GET',
      headers: {
        ...init?.headers,
        'Content-Type': 'application/json',
      },
    }

    if (Object.keys(query ?? {}).length) {
      const separator = url.includes('?') ? '&' : '?'
      url = url + separator + stringifyQuery(query)
    }

    const response = await this.fetch(url, options)
    const text = await response.text()
    const json = JSON.parse(text)

    return json
  }

  /**
   *
   * @param url request url
   * @param body json body payload
   * @param init request options
   * @returns json
   */
  async postJson<Body extends {}>(url: string, body?: Body, init?: RequestInit) {
    const options: RequestInit = {
      ...init,
      method: 'POST',
      headers: {
        ...init?.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }

    const response = await this.fetch(url, options)
    const text = await response.text()
    const json = JSON.parse(text)

    return json
  }

  /**
   * redirect to url
   * @param url
   */
  async redirect(url: string) {
    if (this.page.res) {
      const res = this.page.res
      res.writeHead(302, { Location: url })
      res.end()
    } else if (url.startsWith('http') || url.startsWith('//')) {
      window.location.replace(url)
    } else {
      await Router.replace(url, url)
    }
  }
}

export type ProviderProps = {
  controllers: Controller[]
}

/**
 * Provider for injecting controllers
 */
export const Provider: React.FC<ProviderProps> = ({ controllers, children }) => {
  const valueRef = useRef<ControllerReactContextValue | null>(null)

  if (!valueRef.current) {
    const ctrls = {} as ControllerReactContextValue

    for (let i = controllers.length - 1; i >= 0; i -= 1) {
      const ctrl = controllers[i]
      const ctrlId = ((ctrl.constructor as unknown) as ControllerCtor).getId()
      ctrls[`${ctrlId}`] = ctrl
    }

    valueRef.current = ctrls
  }

  return <ControllerReactContext.Provider value={valueRef.current}>{children}</ControllerReactContext.Provider>
}

export const getUserAgent = (req?: IncomingMessage): string => {
  const userAgent = req?.headers['user-agent'] ?? ''

  if (typeof window !== 'undefined') {
    return window.navigator.userAgent
  }

  return userAgent
}
