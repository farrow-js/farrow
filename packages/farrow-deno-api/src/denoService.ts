import { Response, RouterPipeline, useReq } from 'farrow-http'
import { ApiEntries } from 'farrow-api'
import { toJSON } from 'farrow-api/dist/toJSON'
import { CodegenOptions } from 'farrow-api/dist/codegen'
import { format } from 'farrow-api/dist/prettier'
import { ApiService } from 'farrow-api-server'
import { codegen } from './codegen'

export type CreateDenoServiceOptions = {
  entries: ApiEntries
  namespace?: string
  codegen?: CodegenOptions
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

export const createDenoService = (options: CreateDenoServiceOptions): RouterPipeline => {
  const { entries, namespace = 'client' } = options
  const path = `/${namespace}.ts`

  const service = ApiService({ entries })

  service.route(path).use(() => {
    const req = useReq()
    const formatResult = toJSON(entries)
    const url = `http://${req.headers.host}${req.url}`.replace(path, '')
    let source = codegen(formatResult, {
      ...options.codegen,
      url,
    })

    if (options.transform) {
      source = options.transform(source)
    }

    if (options.format) {
      source = options.format(source)
    } else {
      source = format(source)
    }

    return Response.text(source)
  })

  return service
}

export const DenoService = createDenoService
