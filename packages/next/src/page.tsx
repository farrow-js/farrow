import React, { ComponentType, useRef } from 'react'
import { NextPage, NextPageContext } from 'next'
import { Controller, Provider, ControllerCtors, ControllerInstancesType, getUserAgent } from './controller'
import { replaceState } from './store'
import { ModuleContext } from './module'
import { PageInfo } from './page-info'

export type PageOptions<T extends ControllerCtors> = {
  View: ComponentType<{}>
  Controllers: T
  preload?: (ctrls: ControllerInstancesType<T>) => void | Promise<void>
}

export type PageProps = Pick<NextPageContext, 'pathname' | 'query' | 'asPath'> & {
  userAgent: string
  states: any[]
}

export type PageContextType = Omit<NextPageContext, 'AppTree'> & {
  /**
   * the controller was initilized at.
   */
  tag: 'getInitialProps' | 'FC'
  userAgent: string
}

export const page = <T extends ControllerCtors>(options: PageOptions<T>): NextPage<PageProps> => {
  let { Controllers, preload, View } = options
  let Page: NextPage<PageProps> = (props) => {
    let ctrlsRef = useRef<Controller[] | null>(null)

    if (!ctrlsRef.current) {
      let pageCtx: PageContextType = {
        userAgent: props.userAgent,
        pathname: props.pathname,
        query: props.query,
        asPath: props.asPath,
        tag: 'FC',
      }
      let pageInfo = PageInfo.provide(pageCtx)
      let moduleContext = new ModuleContext().injectProviderValues([pageInfo])

      let ctrls = Object.values(Controllers).map((Controller, index) => {
        let ctrl = moduleContext.new(Controller)
        let state = props.states[index]
        replaceState(ctrl.store, state)
        return ctrl
      })

      ctrlsRef.current = ctrls
    }

    return (
      <Provider controllers={ctrlsRef.current}>
        <View />
      </Provider>
    )
  }

  Page.getInitialProps = async (ctx) => {
    let { pathname, query, asPath } = ctx

    let { AppTree, ...rest } = ctx

    let userAgent = getUserAgent(ctx.req)

    let pageCtx: PageContextType = {
      ...rest,
      userAgent,
      tag: 'getInitialProps',
    }

    let pageInfo = PageInfo.provide(pageCtx)
    let moduleCtx = new ModuleContext().injectProviderValues([pageInfo])

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
