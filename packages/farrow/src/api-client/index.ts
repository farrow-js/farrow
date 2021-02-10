import fs from 'fs/promises'
import { ensureDir } from 'fs-extra'
import { dirname } from 'path'
import fetch from 'node-fetch'
import { FormatResult } from 'farrow-api/dist/toJSON'
import { codegen } from 'farrow-api/dist/codegen'
import { format } from 'farrow-api/dist/prettier'

const writeFile = async (filename: string, content: string) => {
  try {
    await ensureDir(dirname(filename))
  } finally {
    await fs.writeFile(filename, content)
  }
}

export type ApiClientOptions = {
  src: string
  dist: string
  pollingInterval?: number
  transform?: (source: string) => string
  format?: (source: string) => string
}

export const createApiClient = (options: ApiClientOptions) => {
  let config = {
    ...options,
    pollingInterval: 3000,
  }

  let tid: ReturnType<typeof setInterval> | null = null

  let prevText = ''

  let getIntrospection = async () => {
    let data = {
      input: {
        __introspection__: true,
      },
    }
    let options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
    let response = await fetch(config.src, options)
    let text = await response.text()

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

  let syncServer = async () => {
    let result = await getIntrospection()

    if (!result) {
      return
    }

    let source = codegen(result.output)

    if (config.transform) {
      source = config.transform(source)
    }

    if (config.format) {
      source = config.format(source)
    } else {
      source = format(source)
    }

    console.log(`synced`, config)

    await writeFile(config.dist, source)
  }

  let start = () => {
    stop()
    tid = setInterval(async () => {
      try {
        await syncServer()
      } catch (error) {
        console.log(error.stack)
      }
    }, config.pollingInterval)
  }

  let stop = () => {
    if (tid !== null) {
      clearInterval(tid)
    }
  }

  return {
    start,
    stop,
  }
}

export type CreateApiClientsOptions = {
  services: ApiClientOptions[]
}

export const createApiClients = (options: CreateApiClientsOptions) => {
  let syncers = options.services.map(createApiClient)

  let start = () => {
    syncers.map((syncer) => syncer.start())
  }

  let stop = () => {
    syncers.map((syncer) => syncer.stop())
  }

  return {
    start,
    stop,
  }
}
