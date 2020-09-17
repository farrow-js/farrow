import { RequestInfo, ResponseInfo, createRouterPipeline } from '../router'
import {
  ContextStorage,
  createContextualPipeline,
  createHook,
  createMiddleware,
  ContextualPipelineOptions,
} from '../core'

export type CreateAppOptions = {
  contexts?: ContextStorage
}

export const createApp = <T extends CreateAppOptions>(options?: T) => {
  let pipeline = createContextualPipeline<RequestInfo, ResponseInfo>({
    contexts: options?.contexts,
  })

  let add = pipeline.add

  let run = (input: RequestInfo) => {
    return pipeline.run(input)
  }

  return {
    add,
    run,
  }
}
