import { Router, RouterOptions, RequestHandler } from 'express'
import { SchemaCtorInput, toSchemaCtor } from 'farrow-schema'
import { createSchemaValidator, ValidationError, Validator } from 'farrow-schema/validator'
import { ApiDefinition, ApiType, ApiEntries, getContentType, isApi } from 'farrow-api'
import { createContainer } from 'farrow-pipeline'
import { toJSON } from 'farrow-api/dist/toJSON'

import { RequestContext, ResponseContext, NextContext } from './context'

export type ApiRouterOptions = RouterOptions & {
  errorStack?: boolean
  errorStatus?: boolean
}

export type ApiRouterMatcher = (path: string, api: ApiType) => void

type Method = 'use' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'

export type ApiRouter = {
  use: ApiRouterMatcher
  get: ApiRouterMatcher
  post: ApiRouterMatcher
  put: ApiRouterMatcher
  delete: ApiRouterMatcher
  patch: ApiRouterMatcher
  options: ApiRouterMatcher
  head: ApiRouterMatcher
  router: Router
}

const INTROSPECTION_ROUTE_PATH = '/__introspection__'

export const createApiRouter = (options: ApiRouterOptions = {}): ApiRouter => {
  options = {
    errorStack: process.env.NODE_ENV !== 'production',
    ...options,
  }

  const router = Router(options)
  const createMatcher = (method: Method): ApiRouterMatcher => {
    return (path, api) => {
      if (!isApi(api)) {
        throw new Error(
          `The object passed:${Object.toString.apply(
            api,
          )} in is not Farrow API(defined at https://github.com/farrow-js/farrow/blob/master/packages/farrow-api/src/api.ts#L65).`,
        )
      }

      apiEntries[path] = api

      const definition = api.definition as ApiDefinition<SchemaCtorInput>

      const InputSchema = toSchemaCtor(getContentType(definition.input))
      const validateApiInput = createSchemaValidator(InputSchema)

      const OutputSchema = toSchemaCtor(getContentType(definition.output))
      const validateApiOutput = createSchemaValidator(OutputSchema)

      router[method](path, (request, response, next) => {
        const container = createContainer({
          request: RequestContext.create(request),
          response: ResponseContext.create(response),
          next: NextContext.create(next),
        })

        const input = {
          ...request.params,
          ...request.query,
          ...request.body,
        }

        const inputResult = validateApiInput(input)

        if (inputResult.isErr) {
          if (options.errorStatus) {
            response.status(400)
          }

          const message = getErrorMessage(inputResult.value)
          return response.json(InputValidationError(message))
        }

        try {
          const output = api.run(input, { container })

          const outputResult = validateApiOutput(output)
          if (outputResult.isErr) {
            if (options.errorStatus) {
              response.status(500)
            }

            const message = getErrorMessage(outputResult.value)
            return response.json(OutputValidationError(message))
          }

          return response.json(output)
        } catch (error) {
          if (options.errorStatus) {
            response.status(500)
          }

          const message = (options.errorStack ? error?.stack || error?.message : error?.message) ?? ''
          return response.json(RuntimeError(message))
        }
      })
    }
  }

  const apiEntries: ApiEntries = {}
  router.get(INTROSPECTION_ROUTE_PATH, (_, res) => {
    res.json(toJSON(apiEntries))
  })

  return {
    use: createMatcher('use'),
    get: createMatcher('get'),
    post: createMatcher('post'),
    put: createMatcher('put'),
    delete: createMatcher('delete'),
    patch: createMatcher('patch'),
    options: createMatcher('options'),
    head: createMatcher('head'),
    router,
  }
}

export const ApiRouter = createApiRouter

const InputValidationError = (message: string) => {
  return {
    code: -1,
    type: 'InputValidationError',
    message,
  }
}

const OutputValidationError = (message: string) => {
  return {
    code: -1,
    type: 'OutputValidationError',
    message,
  }
}

const RuntimeError = (message: string) => {
  return {
    code: -1,
    type: 'RuntimeError',
    message,
  }
}

const getErrorMessage = (error: ValidationError) => {
  let { message } = error

  if (Array.isArray(error.path) && error.path.length > 0) {
    message = `path: ${JSON.stringify(error.path)}\n${message}`
  }

  return message
}
