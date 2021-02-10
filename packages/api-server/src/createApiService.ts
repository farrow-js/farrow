import { HttpMiddleware, Router, Response, HttpError } from 'farrow-http'
import { List, SchemaCtor, SchemaCtorInput, Struct, toSchemaCtor, Ok, Result, Any } from 'farrow-schema'
import { ApiDefinition, ApiEntries, getContentType, isApi } from 'farrow-api'
import { toJSON } from 'farrow-api/dist/toJSON'
import { createSchemaValidator, ValidationError, Validator } from 'farrow-schema/validator'
import get from 'lodash.get'

export type ApiServiceType = {
  middleware: HttpMiddleware
}

const BodySchema = Struct({
  path: List(String),
  input: Any,
})

const validateBody = createSchemaValidator(BodySchema)

type IsOk = (result: Result<any, ValidationError>) => asserts result is Ok<any>

const isOk: IsOk = (result) => {
  if (result.isErr) {
    let { message } = result.value

    if (result.value.path) {
      message = `path: ${JSON.stringify(result.value.path)}\n${message}`
    }

    throw new HttpError(message, 400)
  }
}

export type CreateApiServiceOptions = {
  entries: ApiEntries
}

export const createApiService = (options: CreateApiServiceOptions): ApiServiceType => {
  let { entries } = options

  let router = Router()

  let validatorMap = new WeakMap<SchemaCtor, Validator>()

  let getValidator = (Schema: SchemaCtor) => {
    if (validatorMap.has(Schema)) {
      return validatorMap.get(Schema)!
    }
    let validator = createSchemaValidator(Schema)
    validatorMap.set(Schema, validator)
    return validator
  }

  router.use(async (request, next) => {
    if (request.method?.toLowerCase() !== 'post') {
      return next()
    }

    if (request.body?.input?.__introspection__ === true) {
      let output = toJSON(entries)
      return Response.json({
        output,
      })
    }

    let bodyResult = validateBody(request.body)

    isOk(bodyResult)

    let api = get(entries, bodyResult.value.path)

    if (!isApi(api)) {
      throw new HttpError(`The target API is not found with the path: [${bodyResult.value.path.join(', ')}]`)
    }

    let definition = api.definition as ApiDefinition<SchemaCtorInput>

    let InputSchema = toSchemaCtor(getContentType(definition.input))

    let validateApiInput = getValidator(InputSchema)

    let inputResult = validateApiInput(bodyResult.value.input)

    isOk(inputResult)

    let output = await api(inputResult.value)

    return Response.json({
      output,
    })
  })

  return {
    middleware: router.middleware,
  }
}

export const ApiService = createApiService
