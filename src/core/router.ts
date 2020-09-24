import { createPipeline, Next, usePipeline, PipelineOptions } from './pipeline/pipeline'
import * as Schema from './schema'

export interface RouterOptions<I, O> extends PipelineOptions<O> {
  input: Schema.Type<I>
  output: Schema.Type<O>
  onValidationFailed?: (message: string) => void
}

export const createRouter = <I, O>(options: RouterOptions<I, O>) => {
  let pipeline = createPipeline<I, O>({
    defaultOutput: options.defaultOutput,
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
