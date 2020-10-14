import {
  createPipeline,
  Next,
  usePipeline,
  PipelineOptions,
  Middleware,
  RunPipelineOptions,
} from './pipeline'
import * as Schema from './schema'

export interface RouterPipelineOptions<I, O> extends PipelineOptions {
  input: Schema.Type<I>
  output: Schema.Type<O>
}

export type RouterPipeline<I, O> = {
  middleware: <T>(input: T, next: Next<T, O>) => O
  add: (input: Middleware<I, O>) => void
  run: (input: I, options: RunPipelineOptions<I, O>) => O
}

export const createRouterPipeline = <I, O>(
  options: RouterPipelineOptions<I, O>
): RouterPipeline<I, O> => {
  let pipeline = createPipeline<I, O>({
    contexts: options.contexts,
  })

  let middleware = function <T>(input: T, next: Next<T, O>) {
    let runPipeline = usePipeline(pipeline)
    let result = options.input.validate(input)

    if (result.isErr) {
      return next()
    }

    return runPipeline(result.value)
  }

  return {
    middleware,
    add: pipeline.add,
    run: pipeline.run,
  }
}
