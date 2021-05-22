import fs from 'fs/promises'
import { ensureDir } from 'fs-extra'
import { dirname } from 'path'
import fetch from 'node-fetch'
import { FormatResult } from 'farrow-api/dist/toJSON'
import { codegen, CodegenOptions } from 'farrow-api/dist/codegen'
import { format } from 'farrow-api/dist/prettier'
import type { IntrospectionCalling } from 'farrow-api-server'
import { replaceUrl } from './replaceUrl'

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
   * use alias for farrow-api-client instead of src address
   */
  alias?: string

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
  /**
   * transform source code received from server
   * it's useful when need to attach custom code snippet
   */
  transform?: (source: string) => string
  /**
   * format source code via codegen
   */
  format?: (source: string) => string
}

export const createApiClient = (options: ApiClientOptions) => {
  const config = {
    ...options,
    pollingInterval: 3000,
  }

  let tid: ReturnType<typeof setInterval> | null = null

  let prevText = ''

  const getIntrospection = async () => {
    const data: IntrospectionCalling = {
      type: 'Introspection',
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
    const response = await fetch(config.src, options)
    const text = await response.text()

    if (text === prevText) {
      return
    }

    prevText = text

    try {
      return JSON.parse(text) as { output: FormatResult }
    } catch (error) {
      console.log(`Failed to fetch ${config.src}\nerror: ${error.message}\nresponse:${text}`)
    }
  }

  const sync = async () => {
    const result = await getIntrospection()

    if (!result) {
      return
    }

    let source = codegen(result.output, {
      ...config.codegen,
      url: config.alias ?? config.src,
    })

    if (config.transform) {
      source = config.transform(source)
    }

    if (config.format) {
      source = config.format(source)
    } else {
      source = format(source)
    }

    if (typeof config.logger === 'function') {
      config.logger(options)
    } else if (config.logger !== false) {
      console.log(`synced`, {
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
      } catch (error) {
        console.log(error.stack)
      }
    }, config.pollingInterval)
  }

  const stop = () => {
    if (tid !== null) {
      clearInterval(tid)
    }
  }

  const build = async () => {
    await replaceUrl(options)
  }

  return {
    sync,
    start,
    stop,
    build,
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

  const build = async () => {
    const promises = clients.map((client) => client.build())
    await Promise.all(promises)
  }

  return {
    sync,
    start,
    stop,
    build,
  }
}
