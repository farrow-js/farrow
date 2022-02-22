import { Router, Response, RouterPipeline } from 'farrow-http'
import { List, SchemaCtor, SchemaCtorInput, Struct, toSchemaCtor, Any } from 'farrow-schema'
import { ApiDefinition, ApiEntries, getContentType, isApi } from 'farrow-api'
import { FormatResult, toJSON } from 'farrow-api/dist/toJSON'
import { createSchemaValidator, ValidationError, Validator } from 'farrow-schema/validator'
import get from 'lodash.get'
import {
  ApiError,
  ApiSuccess,
  SingleCalling,
  ApiResponseSingle,
  BatchResponse,
  IntrospectionCalling,
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

  let formatResult: FormatResult | undefined

  const handleCalling = async (calling: SingleCalling | IntrospectionCalling): Promise<ApiResponseSingle> => {
    /**
     * capture introspection request
     */
    if (config.introspection && calling.type === 'Introspection') {
      const output = (formatResult = formatResult ?? toJSON(entries))
      return ApiSuccess(output)
    }

    const bodyResult = validateBody(calling)

    if (bodyResult.isErr) {
      const message = getErrorMessage(bodyResult.value)
      return ApiError(message)
    }

    const api = get(entries, bodyResult.value.path)

    if (!isApi(api)) {
      const message = `The target API was not found with the path: [${bodyResult.value.path.join(', ')}]`
      return ApiError(message)
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
      return ApiError(message)
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
        return ApiError(message)
      }

      /**
       * response output
       */
      return ApiSuccess(outputResult.value)
    } catch (error: any) {
      const message = (config.errorStack ? error?.stack || error?.message : error?.message) ?? ''
      return ApiError(message)
    }
  }

  router.use(async (request, next) => {
    if (request.method?.toLowerCase() !== 'post') {
      return next()
    }

    if (request.body?.type === 'Batch') {
      // batch calling
      const callings = request.body!.callings

      if (Array.isArray(callings)) {
        const result = await Promise.all(callings.map(handleCalling))
        return Response.json(BatchResponse(result))
      }
      const message = `Unknown structure of request`
      return Response.json(ApiError(message))
    }

    // single calling
    return Response.json(await handleCalling(request.body))
  })

  return router
}

export const ApiService = createApiService
