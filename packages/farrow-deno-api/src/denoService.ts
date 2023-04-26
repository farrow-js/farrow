import { Response, route, Router, RouterPipeline } from 'farrow-http'
import { ApiEntries } from 'farrow-api'
import { codegen, CodegenOptions } from 'farrow-api/dist/codegen'
import { toJSON } from 'farrow-api/src/toJSON'
import { ApiService } from 'farrow-api-server'

export type CreateDenoServiceOptions = {
  entries: ApiEntries
  namespace?: string
  codegen?: CodegenOptions
}

export const createDenoService = (options: CreateDenoServiceOptions): RouterPipeline => {
  const { entries, namespace = 'client' } = options
  const path = `/${namespace}.ts`

  const service = Router()

  service.route(path).use(() => {
    const formatResult = toJSON(entries)
    let source = codegen(formatResult, {
      ...options.codegen,
    })

    return Response.text(source)
  })

  service.use(ApiService({ entries }))

  return service
}

export const DenoService = createDenoService
