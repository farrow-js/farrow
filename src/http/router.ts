import { match as createMatch } from 'path-to-regexp'
import { createPipeline, Next, usePipeline, Middleware, Context } from '../core/pipeline'
import * as Schema from '../core/schema'

export type RouterPipelineOptions = {
  pathname: string
  method?: string
  params?: Schema.Type
  query?: Schema.Type
  body?: Schema.Type
  headers?: Schema.Type
  cookies?: Schema.Type
}

export type RequestSchema<T extends RouterPipelineOptions> = Schema.Type<
  {
    [key in keyof T]: T[key] extends Schema.Type ? Schema.RawType<T[key]> : T[key]
  }
>

const createRequestSchema = <T extends RouterPipelineOptions>(options: T): RequestSchema<T> => {
  let fileds: Schema.Fields = {}

  for (let key in options) {
    let value = options[key]
    if (Schema.isType(value)) {
      fileds[key] = value
      // tslint:disable-next-line: strict-type-predicates
    } else if (typeof value === 'string') {
      fileds[key] = Schema.string
    } else {
      throw new Error(`Unknown option, ${key}: ${value}`)
    }
  }

  return Schema.object(fileds) as RequestSchema<T>
}

type MaybePromise<T> = T | Promise<T>

export type RouterRequest<T extends RouterPipelineOptions> = Schema.RawType<RequestSchema<T>>

export type RouterResponse = MaybePromise<Schema.Term>

export type RouterPipeline<I, O> = {
  middleware: <T extends RouterInput>(input: T, next: Next<T, O>) => O
  add: (input: Middleware<I, O>) => void
  run: (input: I, context?: Context | undefined) => O
}

export type RouterInput = {
  pathname: string
  method?: string
}

export const createRouterPipeline = <T extends RouterPipelineOptions>(
  options: T
): RouterPipeline<RouterRequest<T>, RouterResponse> => {
  type Input = RouterRequest<T>
  type Output = RouterResponse
  type ResultPipeline = RouterPipeline<Input, Output>

  let pipeline = createPipeline<Input, Output>()

  let schema: Schema.Type<Input> = createRequestSchema(options)

  let match = createMatch(options.pathname)

  let middleware: ResultPipeline['middleware'] = function (input, next) {
    let runPipeline = usePipeline(pipeline)

    if (typeof options.method === 'string') {
      if (options.method !== input.method) {
        return next()
      }
    }

    let matches = match(input.pathname)

    if (!matches) {
      return next()
    }

    let params = matches.params

    let result = schema.validate({
      ...input,
      params,
    })

    if (result.isErr) {
      throw new Error(result.value.message)
    }

    return runPipeline(result.value)
  }

  return {
    middleware,
    add: pipeline.add,
    run: pipeline.run,
  }
}
