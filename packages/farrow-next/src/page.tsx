import React, { ComponentType, useContext, useEffect, useRef } from 'react'
import { NextPage, NextPageContext } from 'next'
import { stringify as stringifyQuery, ParsedQs } from 'qs'
import { Controller, Provider, ControllerCtors, ControllerInstancesType, getUserAgent } from './controller'
import { replaceState } from './store'
import { ModuleContext } from './module'
import { PageInfo, GetPageInfo } from './page-info'

export type ConstrollerStates<T extends ControllerCtors> = InstanceType<T[keyof T]>['state']

export type PageOptions<T extends ControllerCtors> = {
  View: ComponentType<{}>
  Controllers: T
  preload?: (ctrls: ControllerInstancesType<T>) => void | Promise<void>
}

export type PageProps<State = any> = Pick<NextPageContext, 'pathname' | 'query' | 'asPath'> & {
  userAgent: string
  states: State[]
}

export const PageInfoContext = React.createContext<PageInfo | null>(null)

export const usePageInfo = (): PageInfo => {
  let pageInfo = useContext(PageInfoContext)
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
  let pageInfo = usePageInfo()
  let effectCallbackRef = useRef<QueryChangedEffectCallback>(effect)
  let pageInfoRef = useRef<PageInfo>(pageInfo)

  useEffect(() => {
    if (pageInfoRef.current !== pageInfo) {
      let curr = pageInfo.query
      let prev = pageInfoRef.current.query

      pageInfoRef.current = pageInfo

      if (stringifyQuery(pageInfoRef.current.query) === stringifyQuery(pageInfo.query)) {
        effectCallbackRef.current(curr, prev)
      }
    }
  }, [pageInfo])

  useEffect(() => {
    effectCallbackRef.current = effect
  }, [effect])
}

export const page = <T extends ControllerCtors>(options: PageOptions<T>): NextPage<PageProps<ConstrollerStates<T>>> => {
  let { Controllers, preload, View } = options
  let Page: NextPage<PageProps<ConstrollerStates<T>>> = (props) => {
    type Props = PageProps<ConstrollerStates<T>>
    type PageRefValueType = { ctrls: Controller[]; props: Props; pageInfo: PageInfo }
    let pageInfoRef = useRef<PageRefValueType | null>(null)

    let pageInfo = {
      userAgent: props.userAgent,
      pathname: props.pathname,
      query: props.query,
      asPath: props.asPath,
    }

    let getCtrls = () => {
      let getPageInfo = GetPageInfo.provide(() => {
        if (!pageInfoRef.current?.pageInfo) {
          throw new Error(`Page info is not found`)
        }
        return pageInfoRef.current.pageInfo
      })
      let moduleContext = new ModuleContext().injectProviderValues([getPageInfo])

      let ctrls = Object.values(Controllers).map((Controller, index) => {
        let ctrl = moduleContext.new(Controller)
        let state = props.states[index]
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
    let { pathname, query, asPath } = ctx

    let { AppTree, ...rest } = ctx

    let userAgent = getUserAgent(ctx.req)

    let pageInfo: PageInfo = {
      ...rest,
      userAgent,
    }

    let getPageInfo = GetPageInfo.provide(() => pageInfo)
    let moduleCtx = new ModuleContext().injectProviderValues([getPageInfo])

    let ctrlsMap = {} as ControllerInstancesType<T>

    let ctrlsKeys = Object.keys(Controllers)

    let ctrls = Object.values(Controllers).map((Controller, index) => {
      let ctrl = moduleCtx.new(Controller)
      let key = ctrlsKeys[index] as keyof T
      ctrlsMap[key] = ctrl as ControllerInstancesType<T>[keyof T]
      return ctrl
    })

    /**
     * preload ctrls
     */
    let promises = ctrls.map((ctrl) => ctrl.preload?.())

    await Promise.all(promises)
    await preload?.(ctrlsMap)

    let states = ctrls.map((ctrl) => ctrl.store.getState())

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
