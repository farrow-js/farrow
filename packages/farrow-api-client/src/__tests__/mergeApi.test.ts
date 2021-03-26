import { createApiPipelineWithUrl, createApiMerge, ClientApi } from '../index'
import './route'

describe('ApiMerge', () => {
  it('can merge request', async () => {
    let apiPipelineWithUrl = createApiPipelineWithUrl('/normal/api')
    let mergeApi = createApiMerge(apiPipelineWithUrl)
    let foo: ClientApi<{ foo: number }, { foo: number }> = (input) => {
      return apiPipelineWithUrl.invoke({ path: ['foo'], input }) as Promise<{ foo: number }>
    }
    let bar: ClientApi<{ bar: number }, { bar: number }> = (input) => {
      return apiPipelineWithUrl.invoke({ path: ['bar'], input }) as Promise<{ bar: number }>
    }
    let fooBar = mergeApi(foo, bar)
    let result = await fooBar({
      foo: 1,
      bar: 2,
    })

    expect(result).toEqual([{ foo: 1 }, { bar: 2 }])
  })
})
