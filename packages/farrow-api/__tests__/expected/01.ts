/**
 * This file was generated by farrow-api
 * Don't modify it manually
*/

export type JsonType =
  | number
  | string
  | boolean
  | null
  | undefined
  | JsonType[]
  | { toJSON(): string }
  | { [key: string]: JsonType }

/**
 * @label Collection
*/
export type Collection = {
  namedStruct: NamedStruct,
  namedUnion: NamedUnion,
  namedIntersect: NamedIntersect,
  namedTuple: NamedTuple,
  partialStruct: PartialStruct,
  number: number,
  int: number,
  float: number,
  string: string,
  boolean: boolean,
  id: string,
  date: string,
  nest?: Collection | null | undefined,
  list: (Collection)[],
  struct: {
    named: string,
    nest: {
      a: number,
      nest: {
        b: number
      }
    }
  },
  union: number | string | boolean,
  intersect: {
    a: number
  } & {
    b: number
  } & {
    c: number
  },
  any: any,
  unknown: unknown,
  json: JsonType,
  literal: 1 | "1" | false | null,
  record: Record<string, Collection>,
  /**
  * @remarks test description
  * @deprecated test deprecated
  */
  describable: number
}

/**
 * @label NamedStruct
*/
export type NamedStruct = {
  named: string,
  nest: {
    a: number,
    nest: {
      b: number
    }
  }
}

/**
 * @label NamedUnion
*/
export type NamedUnion =
  | number
  | string
  | number
  | {
    named: string,
    nest: {
      a: number,
      nest: {
        b: number
      }
    }
  }

/**
 * @label NamedIntersect
*/
export type NamedIntersect =
  & {
    a: number
  }
  & {
    b: number
  }
  & {
    c: number
  }
  & {
    named: string,
    nest: {
      a: number,
      nest: {
        b: number
      }
    }
  }

/**
 * @label NamedTuple
*/
export type NamedTuple = [
  {
    a: number
  },
  {
    b: number
  },
  {
    c: number
  },
  {
    named: string,
    nest: {
      a: number,
      nest: {
        b: number
      }
    }
  }
]

/**
 * @label PartialStruct
*/
export type PartialStruct = {
  a?: number | null | undefined,
  b?: number | null | undefined,
  c?: boolean | null | undefined
}

export type ApiClientLoaderInput = {
  path: string[]
  input: JsonType
}

export interface ApiClientLoaderOptions {
  batch?: boolean
  stream?: boolean
  cache?: boolean
}

export type ApiClientOptions = {
  loader: (input: ApiClientLoaderInput, options?: ApiClientLoaderOptions) => Promise<JsonType>
}

export const createApiClient = (options: ApiClientOptions) => {
  return {
    methodA: (input: {
      named: string,
      nest: {
        a: number,
        nest: {
          b: number
        }
      }
    }, loaderOptions?: ApiClientLoaderOptions) => {
      return options.loader(
        {
          path: ['methodA'],
          input: input as JsonType,
        },
        loaderOptions
      ) as Promise<Collection>
    },
    methodB: (input: Collection, loaderOptions?: ApiClientLoaderOptions) => {
      return options.loader(
        {
          path: ['methodB'],
          input: input as JsonType,
        },
        loaderOptions
      ) as Promise<{
        named: string,
        nest: {
          a: number,
          nest: {
            b: number
          }
        }
      }>
    },
    nest: {
      methodA: (input: {
        named: string,
        nest: {
          a: number,
          nest: {
            b: number
          }
        }
      }, loaderOptions?: ApiClientLoaderOptions) => {
        return options.loader(
          {
            path: ['nest', 'methodA'],
            input: input as JsonType,
          },
          loaderOptions
        ) as Promise<Collection>
      },
      nest: {
        methodB: (input: Collection, loaderOptions?: ApiClientLoaderOptions) => {
          return options.loader(
            {
              path: ['nest', 'nest', 'methodB'],
              input: input as JsonType,
            },
            loaderOptions
          ) as Promise<{
            named: string,
            nest: {
              a: number,
              nest: {
                b: number
              }
            }
          }>
        }
      }
    }
  }
}