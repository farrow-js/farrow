import type { JsonType } from 'farrow-api-server'
import type { ApiPipelineWithUrl } from './apiPipeline'

/**
 * https://github.com/type-challenges/type-challenges/issues/737#issue-792953948
 *
 * UnionToIntersection<{ foo: string } | { bar: string }> =
 *  { foo: string } & { bar: string }.
 */
type UnionToIntersection<U> = (U extends unknown ? (arg: U) => 0 : never) extends (arg: infer I) => 0 ? I : never

/**
 * LastInUnion<1 | 2> = 2.
 */
type LastInUnion<U> = UnionToIntersection<U extends unknown ? (x: U) => 0 : never> extends (x: infer L) => 0 ? L : never

type UnionToTuple<U, Last = LastInUnion<U>> = [U] extends [never] ? [] : [...UnionToTuple<Exclude<U, Last>>, Last]

export type ClientApi<I extends JsonType, O extends JsonType> = (input: I) => Promise<O>

type Input<APIS extends ClientApi<any, any>[]> = APIS[never] extends ClientApi<infer I, any> ? I : never
type Output<APIS extends ClientApi<any, any>[]> = APIS[never] extends ClientApi<any, infer O> ? UnionToTuple<O> : never

export const createApiMerge = (apiPipeline: ApiPipelineWithUrl) => <
  APIS extends ClientApi<any, any>[],
  I extends JsonType = Input<APIS>,
  O extends JsonType[] = Output<APIS>
>(
  ...apis: APIS
): ClientApi<I, O> => {
  let paths = apis.map((api) => api.name)
  return (input: I): Promise<O> => {
    return Promise.all(
      paths.map((path) =>
        apiPipeline.invoke({
          path: [path],
          input,
        }),
      ),
    ) as Promise<O>
  }
}
