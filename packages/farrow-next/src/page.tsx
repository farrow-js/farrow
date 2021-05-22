import React, { ComponentType, useContext, useEffect, useRef } from 'react'
import { NextPage, NextPageContext } from 'next'
import { stringify as stringifyQuery, ParsedQs } from 'qs'
import { Controller, Provider, ControllerCtors, ControllerInstancesType, getUserAgent } from './controller'
import { replaceState } from './store'
import { ModuleContext, ModuleProviderValue } from './module'
import { PageInfo, GetPageInfo } from './page-info'

export type ControllerStates<T extends ControllerCtors> = InstanceType<T[keyof T]>['state']

export type PageOptions<T extends ControllerCtors> = {
  View: ComponentType<{}>
  Controllers: T
  Providers?: ModuleProviderValue[]
  preload?: (ctrls: ControllerInstancesType<T>) => void | Promise<void>
}

export type PageProps<State = any> = Pick<NextPageContext, 'pathname' | 'query' | 'asPath'> & {
  userAgent: string
  states: State[]
}

export const PageInfoContext = React.createContext<PageInfo | null>(null)

export const usePageInfo = (): PageInfo => {
  const pageInfo = useContext(PageInfoContext)
  if (!pageInfo) {
    throw new Error(`pageInfo was not found`)
  }
  return pageInfo
}

export type QueryChangedEffectCallback = (curr: ParsedQs, prev: ParsedQs) => unknown

/**
 * trigger effect callback when query changed
 * @param effect
 */
export const useQueryChangedEffect = (effect: QueryChangedEffectCallback) => {
  const pageInfo = usePageInfo()
  const effectCallbackRef = useRef<QueryChangedEffectCallback>(effect)
  const pageInfoRef = useRef<PageInfo>(pageInfo)

  useEffect(() => {
    if (pageInfoRef.current !== pageInfo) {
      const curr = pageInfo.query
      const prev = pageInfoRef.current.query

      pageInfoRef.current = pageInfo

      // only detect query changed
      if (pageInfo.pathname !== pageInfoRef.current.pathname) {
        return
      }

      // trigger effect callback when query changed
      if (stringifyQuery(prev) !== stringifyQuery(curr)) {
        effectCallbackRef.current(curr, prev)
      }
    }
  }, [pageInfo])

  useEffect(() => {
    effectCallbackRef.current = effect
  }, [effect])
}

export const page = <T extends ControllerCtors>(options: PageOptions<T>): NextPage<PageProps<ControllerStates<T>>> => {
  const { Controllers, preload, View } = options
  const Page: NextPage<PageProps<ControllerStates<T>>> = (props) => {
    type Props = PageProps<ControllerStates<T>>
    type PageRefValueType = { ctrls: Controller[]; props: Props; pageInfo: PageInfo }
    const pageInfoRef = useRef<PageRefValueType | null>(null)

    const pageInfo = {
      userAgent: props.userAgent,
      pathname: props.pathname,
      query: props.query,
      asPath: props.asPath,
    }

    const getCtrls = () => {
      const getPageInfo = GetPageInfo.provide(() => {
        if (!pageInfoRef.current?.pageInfo) {
          throw new Error(`Page info is not found`)
        }
        return pageInfoRef.current.pageInfo
      })
      const moduleContext = new ModuleContext().injectProviderValues([getPageInfo, ...(options.Providers ?? [])])

      const ctrls = Object.values(Controllers).map((Controller, index) => {
        const ctrl = moduleContext.use(Controller)
        const state = props.states[index]
        replaceState(ctrl.store, state)
        return ctrl
      })

      return ctrls
    }

    // initialize
    if (!pageInfoRef.current) {
      pageInfoRef.current = {
        ctrls: getCtrls(),
        props,
        pageInfo,
      }
    }

    // pathname change
    // re-create ctrls
    if (props.pathname !== pageInfoRef.current.props.pathname) {
      pageInfoRef.current = {
        ctrls: getCtrls(),
        props,
        pageInfo,
      }
    }

    // update
    if (props.asPath !== pageInfoRef.current.props.asPath) {
      pageInfoRef.current.pageInfo = pageInfo
      pageInfoRef.current.props = props
    }

    return (
      <PageInfoContext.Provider value={pageInfo}>
        <Provider controllers={pageInfoRef.current.ctrls}>
          <View />
        </Provider>
      </PageInfoContext.Provider>
    )
  }

  Page.getInitialProps = async (ctx) => {
    const { pathname, query, asPath } = ctx

    const { AppTree, ...rest } = ctx

    const userAgent = getUserAgent(ctx.req)

    const pageInfo: PageInfo = {
      ...rest,
      userAgent,
    }

    if (typeof window !== 'undefined') {
      // detect query changed
      if (window.location.pathname === pathname) {
        return {
          userAgent,
          pathname,
          query,
          asPath,
          states: [],
        }
      }
    }

    const getPageInfo = GetPageInfo.provide(() => pageInfo)
    const moduleCtx = new ModuleContext().injectProviderValues([getPageInfo, ...(options.Providers ?? [])])

    const ctrlsMap = {} as ControllerInstancesType<T>

    const ctrlsKeys = Object.keys(Controllers)

    const ctrls = Object.values(Controllers).map((Controller, index) => {
      const ctrl = moduleCtx.use(Controller)
      const key = ctrlsKeys[index] as keyof T
      ctrlsMap[key] = ctrl as ControllerInstancesType<T>[keyof T]
      return ctrl
    })

    /**
     * preload ctrls
     */
    const promises = ctrls.map((ctrl) => ctrl.preload?.())

    await Promise.all(promises)
    await preload?.(ctrlsMap)

    const states = ctrls.map((ctrl) => ctrl.store.getState())

    return {
      userAgent,
      pathname,
      query,
      asPath,
      states,
    }
  }

  Page.displayName = `Page:${View.displayName || View.name}`

  return Page
}
