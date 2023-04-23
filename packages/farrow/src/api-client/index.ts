import fs from 'fs/promises'
import { ensureDir } from 'fs-extra'
import { dirname } from 'path'
import fetch from 'node-fetch'
import { FormatResult } from 'farrow-api/dist/toJSON'
import { CodegenOptions, codegen } from 'farrow-api/dist/codegen'

const writeFile = async (filename: string, content: string) => {
  try {
    await ensureDir(dirname(filename))
  } finally {
    await fs.writeFile(filename, content)
  }
}

export type ApiClientOptions = {
  /**
   * http address of farrow-api
   */
  src: string
  /**
   * file address of codegen target
   */
  dist: string

  /**
   * introspection url
   * default value is /__introspection__
   * if you want to use another url, you can set it here
   */
  introspectionUrl?: string

  /**
   * get introspection from server
   */
  getIntropection?: (body: unknown) => Promise<FormatResult>

  /**
   * codegen options
   */
  codegen?: CodegenOptions
  /**
   * the interval of polling
   * default value is 3000ms
   */
  pollingInterval?: number
  /**
   * logger options for polling
   */
  logger?: false | ((options: ApiClientOptions) => void)
}

export const createApiClient = (options: ApiClientOptions) => {
  const config = {
    ...options,
    pollingInterval: 3000,
    introspectionUrl: '/__introspection__',
    getIntrospection: (x: unknown) => x as FormatResult,
  }

  let tid: ReturnType<typeof setInterval> | null = null

  let prevText = ''

  const getIntrospection = async () => {
    const url = config.introspectionUrl.startsWith('http') ? config.introspectionUrl : config.src + config.introspectionUrl


    try {
      const response = await fetch(url)
      const body = await response.json()
      const introspection = config.getIntrospection(body)
      const text = JSON.stringify(introspection)

      if (text === prevText) {
        return
      }

      prevText = text
      return introspection
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(`Failed to fetch ${config.src}\nerror: ${error.message}`)
        return
      }
      console.log(`Failed to fetch ${config.src}`)
    }
  }

  const sync = async () => {
    const result = await getIntrospection()

    if (!result) {
      return
    }

    let source = codegen(result, {
      ...config.codegen,
    })

    if (typeof config.logger === 'function') {
      config.logger(options)
    } else if (config.logger !== false) {
      console.log(`synced farrow-api`, {
        src: config.src,
        dist: config.dist,
      })
    }

    await writeFile(config.dist, source)
  }

  const start = () => {
    stop()
    tid = setInterval(async () => {
      try {
        await sync()
      } catch (error: any) {
        console.log(error.stack)
      }
    }, config.pollingInterval)
  }

  const stop = () => {
    if (tid !== null) {
      clearInterval(tid)
    }
  }

  return {
    sync,
    start,
    stop,
  }
}

export type CreateApiClientsOptions = {
  services: ApiClientOptions[]
}

export const createApiClients = (options: CreateApiClientsOptions) => {
  const clients = options.services.map(createApiClient)

  const sync = async () => {
    const promises = clients.map((client) => client.sync())
    await Promise.all(promises)
  }

  const start = () => {
    clients.map((client) => client.start())
  }

  const stop = () => {
    clients.map((syncer) => syncer.stop())
  }

  return {
    sync,
    start,
    stop
  }
}
