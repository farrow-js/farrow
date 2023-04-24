import { Router, Response, RouterPipeline, RequestInfo } from 'farrow-http'
import { List, SchemaCtor, SchemaCtorInput, Struct, toSchemaCtor, Any, Literal, Union } from 'farrow-schema'
import { ApiDefinition, ApiEntries, getContentType, isApi } from 'farrow-api'
import { toJSON } from 'farrow-api/dist/toJSON'
import { createSchemaValidator, ValidationError, Validator } from 'farrow-schema/validator'
import get from 'lodash.get'
import {
  ApiErrorResponse,
  ApiBatchSuccessResponse,
  ApiSingleSuccessResponse,
  SingleCalling,
  BatchCalling,
  StreamCalling,
  StreamApiSingleResponse,
  ApiSingleResponse,
  ApiBatchResponse,
} from './apiResponse'

export type ApiServiceType = RouterPipeline

const SingleCallingSchema = Struct({
  type: Literal('Single'),
  path: List(String),
  input: Any,
})

const BatchCallingSchema = Struct({
  type: Literal('Batch'),
  callings: List(SingleCallingSchema),
})

const StreamCallingSchema = Struct({
  type: Literal('Stream'),
  callings: List(SingleCallingSchema),
})

const CallingSchema = Union(SingleCallingSchema, BatchCallingSchema, StreamCallingSchema)

const validateCalling = createSchemaValidator(CallingSchema)

const getErrorMessage = (error: ValidationError) => {
  let { message } = error

  if (Array.isArray(error.path) && error.path.length > 0) {
    message = `path: ${JSON.stringify(error.path)}\n${message}`
  }

  return message
}

export const getIntrospectionUrl = (url: string) => {
  if (!url.endsWith('/')) {
    url = `${url}/`
  }
  return `${url}__introspection__`
}

export type CreateApiServiceOptions = {
  entries: ApiEntries
  errorStack?: boolean
  introspection?: boolean
  validation?: {
    input?: boolean
    output?: boolean
  }
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

  const getIntrospection = () => {
    if (formatResultJSON) {
      return formatResultJSON
    }
    formatResultJSON = JSON.stringify(toJSON(entries), null, 2)
    return formatResultJSON
  }

  const isIntrospectionRequest = (request: RequestInfo) => {
    if (request.pathname === '/__introspection__' && request.method?.toLowerCase() === 'get') {
      return true
    }

    if (request.body?.type === '__introspection__') {
      return true
    }

    return false
  }

  /**
   * capture introspection request
   */
  router.use((request, next) => {
    if (isIntrospectionRequest(request)) {
      if (config.introspection) {
        return Response.json(getIntrospection())
      }

      return Response.status(404).text('Not Found.')
    }

    return next()
  })

  const handleSingleCalling = async (singleCalling: SingleCalling): Promise<ApiSingleResponse> => {
    const api = get(entries, singleCalling.path)

    if (!isApi(api)) {
      const message = `The target API was not found with the path: [${singleCalling.path
        .map((item) => `"${item}"`)
        .join(', ')}]`
      return ApiErrorResponse(message)
    }

    const definition = api.definition as ApiDefinition<SchemaCtorInput>

    const InputSchema = toSchemaCtor(getContentType(definition.input))
    const validateApiInput = getValidator(InputSchema)

    let input = singleCalling.input

    /**
     * validate input
     */
    if (config.validation?.input !== false) {
      const inputResult = validateApiInput(singleCalling.input)

      if (inputResult.isErr) {
        const message = getErrorMessage(inputResult.value)
        return ApiErrorResponse(message)
      }

      input = inputResult.value
    }

    try {
      let output = await api(input)

      if (config.validation?.output !== false) {
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
        output = outputResult.value
      }

      /**
       * response output
       */
      return ApiSingleSuccessResponse(output)
    } catch (error: any) {
      const message = (config.errorStack ? error?.stack || error?.message : error?.message) ?? ''
      return ApiErrorResponse(message)
    }
  }

  const handleBatchCalling = async (batchCalling: BatchCalling): Promise<ApiBatchResponse> => {
    // batch calling
    const callings = batchCalling.callings

    const result = await Promise.all(callings.map(handleSingleCalling))

    return ApiBatchSuccessResponse(result)
  }

  const handleStreamCalling = async (streamCalling: StreamCalling) => {
    // stream callings
    const callings = streamCalling.callings

    return Response.custom(async ({ res }) => {
      const send = (chunk: StreamApiSingleResponse) => {
        res.write(JSON.stringify(chunk))
        res.write('\n')
      }

      res.writeHead(200, {
        'Content-Type': 'application/stream+json',
      })

      await Promise.all(
        callings.map(async (calling, index) => {
          const result = await handleSingleCalling(calling)
          send(StreamApiSingleResponse(index, result))
        }),
      )

      res.end()
    })
  }

  router.use(async (request) => {
    const callingResult = validateCalling(request.body ?? request.query)

    if (callingResult.isErr) {
      const message = getErrorMessage(callingResult.value)
      return Response.json(ApiErrorResponse(message))
    }

    const calling = callingResult.value

    if (calling.type === 'Batch') {
      const result = await handleBatchCalling(calling)
      return Response.json(result)
    } else if (calling.type === 'Stream') {
      return handleStreamCalling(calling)
    }

    const result = await handleSingleCalling(calling)
    return Response.json(result)
  })

  return router
}

export const ApiService = createApiService
