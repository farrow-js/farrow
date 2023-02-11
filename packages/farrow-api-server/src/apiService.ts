import { Router, Response, RouterPipeline } from 'farrow-http'
import { List, SchemaCtor, SchemaCtorInput, Struct, toSchemaCtor, Any } from 'farrow-schema'
import { ApiDefinition, ApiEntries, getContentType, isApi } from 'farrow-api'
import { toJSON } from 'farrow-api/dist/toJSON'
import { createSchemaValidator, ValidationError, Validator } from 'farrow-schema/validator'
import get from 'lodash.get'
import {
  ApiErrorResponse,
  Calling,
  ApiResponse,
  ApiBatchSuccessResponse,
  ApiSingleSuccessResponse,
} from './apiResponse'

export type ApiServiceType = RouterPipeline

const BodySchema = Struct({
  path: List(String),
  input: Any,
})

const validateBody = createSchemaValidator(BodySchema)

const getErrorMessage = (error: ValidationError) => {
  let { message } = error

  if (Array.isArray(error.path) && error.path.length > 0) {
    message = `path: ${JSON.stringify(error.path)}\n${message}`
  }

  return message
}

export const getIntrospectionUrl = (url: string) => {
  if (!url.endsWith('/')) {
    url = url + '/'
  }
  return url + '__introspection__'
}

export type CreateApiServiceOptions = {
  entries: ApiEntries
  errorStack?: boolean
  introspection?: boolean
}

export const createApiService = (options: CreateApiServiceOptions): ApiServiceType => {
  const isNotProduction = process.env.NODE_ENV !== 'production'
  const config = {
    errorStack: isNotProduction,
    introspection: isNotProduction,
    ...options,
  }
  const { entries } = options

  const router = Router()

  const validatorMap = new WeakMap<SchemaCtor, Validator>()

  const getValidator = (Schema: SchemaCtor) => {
    if (validatorMap.has(Schema)) {
      return validatorMap.get(Schema)!
    }
    const validator = createSchemaValidator(Schema)
    validatorMap.set(Schema, validator)
    return validator
  }

  let formatResultJSON = ''

  const handleCalling = async (calling: Calling): Promise<ApiResponse> => {
    if (calling.type === 'Batch') {
      // batch calling
      const callings = calling.callings

      if (Array.isArray(callings)) {
        const result = (await Promise.all(callings.map(handleCalling))) as unknown as ApiSingleSuccessResponse[]
        return ApiBatchSuccessResponse(result)
      }

      return ApiErrorResponse(`Unknown Batch callings: ${callings}`)
    }

    const bodyResult = validateBody(calling)

    if (bodyResult.isErr) {
      const message = getErrorMessage(bodyResult.value)
      return ApiErrorResponse(message)
    }

    const api = get(entries, bodyResult.value.path)

    if (!isApi(api)) {
      const message = `The target API was not found with the path: [${bodyResult.value.path.join(', ')}]`
      return ApiErrorResponse(message)
    }

    const definition = api.definition as ApiDefinition<SchemaCtorInput>

    const InputSchema = toSchemaCtor(getContentType(definition.input))
    const validateApiInput = getValidator(InputSchema)

    /**
     * validate input
     */
    const inputResult = validateApiInput(bodyResult.value.input)

    if (inputResult.isErr) {
      const message = getErrorMessage(inputResult.value)
      return ApiErrorResponse(message)
    }

    try {
      const output = await api(inputResult.value)

      const OutputSchema = toSchemaCtor(getContentType(definition.output))
      const validateApiOutput = getValidator(OutputSchema)

      /**
       * validate output
       */
      const outputResult = validateApiOutput(output)

      if (outputResult.isErr) {
        const message = getErrorMessage(outputResult.value)
        return ApiErrorResponse(message)
      }

      /**
       * response output
       */
      return ApiSingleSuccessResponse(outputResult.value)
    } catch (error: any) {
      const message = (config.errorStack ? error?.stack || error?.message : error?.message) ?? ''
      return ApiErrorResponse(message)
    }
  }

  router.use(async (request, next) => {
    if (request.pathname !== '/' || request.method?.toLowerCase() !== 'post') {
      return next()
    }

    const result = await handleCalling(request.body)

    return Response.json(result)
  })

  /**
   * capture introspection request
   */
  router.use((request, next) => {
    if (request.pathname !== '/__introspection__' || request.method?.toLowerCase() !== 'get') {
      return next()
    }

    if (config.introspection) {
      if (formatResultJSON) {
        return Response.type('json').string(formatResultJSON)
      }
      formatResultJSON = JSON.stringify(toJSON(entries), null, 2)
      return Response.type('json').string(formatResultJSON)
    }

    return Response.status(404).text('Not Found.')
  })

  return router
}

export const ApiService = createApiService
