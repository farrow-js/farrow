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
 * {@label Count}
 */
export type Count = {
  count: number
}

export type CreateApiClientOptions = {
  /**
   * a fetcher for api-client
   */
  fetcher: (input: { path: string[]; input: JsonType }) => Promise<JsonType>
}

export const createApiClient = (options: CreateApiClientOptions) => {
  return {
    /**
     * @param input - Count
     * @returns Count
     */
    incre: (input: Count) => options.fetcher({ path: ['incre'], input }) as Promise<Count>,
    /**
     * @param input - Count
     * @returns Count
     */
    decre: (input: Count) => options.fetcher({ path: ['decre'], input }) as Promise<Count>,
  }
}
