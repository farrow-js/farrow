export type JsonType =
  | number
  | string
  | boolean
  | null
  | undefined
  | JsonType[]
  | {
      toJSON(): string
    }
  | {
      [key: string]: JsonType
    }

/**
 * {@label Collection}
 */
export type Collection = {
  number: number
  int: number
  float: number
  string: string
  boolean: boolean
  id: string
  nest: Collection | null | undefined
  list: Collection[]
  struct: {
    a: number
  }
  union: number | string | boolean
  intersect: {
    a: number
  } & {
    b: number
  } & {
    c: number
  }
  any: any
  unknown: any
  json: JsonType
  literal: 1 | '1' | false | null
  record: Record<string, Collection>
  /**
   * @remarks test description
   * @deprecated test deprecated
   */
  describable: number
}

export type CreateApiClientOptions = {
  /**
   * a fetcher for api-client
   */
  fetcher: (input: { path: string[]; input: JsonType }) => Promise<JsonType>
}

export const createApiClient = (options: CreateApiClientOptions) => {
  return {
    methodA: (input: Collection) => options.fetcher({ path: ['methodA'], input }) as Promise<Collection>,
    methodB: (input: Collection) => options.fetcher({ path: ['methodB'], input }) as Promise<Collection>,
  }
}
