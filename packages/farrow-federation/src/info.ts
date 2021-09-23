import { FormatResult, FormatEntries } from 'farrow-api/dist/toJSON'
import { FormatType, FormatTypes } from 'farrow-schema/formatter'
import { updateApi, updateType } from './helpers'
import { getIntrospection } from './introspection'

import { ApiService, ApiServices, FederationOptions, ApiEntry, ApiEntryMap } from './federation'

export type FederationInfo = {
  schema: FormatResult
  entryMap: ApiEntryMap
}

export const getFederationInfo = async (
  services: ApiServices,
  options: Required<FederationOptions>,
): Promise<FederationInfo> => {
  const schema: FormatResult = {
    protocol: 'Farrow-API',
    types: {},
    entries: {
      type: 'Entries',
      entries: {},
    },
  }
  const entryMap: ApiEntryMap = new Map()

  let typeBaseId = 0
  const addType = (typeId: number, type: FormatType) => {
    schema.types[typeBaseId + typeId] = updateType(type, typeBaseId)
  }

  const concatTypes = (types: FormatTypes) => {
    let max = 0

    for (const typeId in types) {
      const type = types[typeId]
      const tid = Number(typeId)

      if (tid > max) {
        max = tid
      }

      addType(tid, type)
    }

    return max
  }

  const updateEntries = (entries: FormatEntries, apiService: ApiService, path: string[]): FormatEntries => {
    const newEntries: FormatEntries = {
      type: 'Entries',
      entries: {},
    }

    for (const namespace in entries.entries) {
      const item = entries.entries[namespace]

      if (item.type === 'Entries') {
        newEntries.entries[namespace] = updateEntries(item, apiService, [...path, namespace])
      } else {
        newEntries.entries[namespace] = updateApi(item, typeBaseId)

        const apiPath = [...path, namespace]
        const apiEntry: ApiEntry = {
          origin: apiService.url,
          path: apiPath,
        }
        entryMap.set(apiService.namespace, apiService.url)
      }
    }

    return newEntries
  }

  const concat = (nextSchema: FormatResult, apiService: ApiService) => {
    const max = concatTypes(nextSchema.types)

    if (schema.entries.entries[apiService.namespace]) {
      const message = `[Federation] Can't merge the service at ${apiService.url} because the namespace: ${apiService.namespace} has been used`
      if (options.strict) {
        throw new Error(message)
      } else {
        console.error(message)
      }
    } else {
      const entries = updateEntries(nextSchema.entries, apiService, [])
      schema.entries.entries[apiService.namespace] = entries
    }

    typeBaseId += max
  }

  for (const service of services) {
    const result = await getIntrospection(service.url, options.fetch)

    if (result.isOk) {
      concat(result.value, service)
    } else {
      const message = `[Federation]: Can't connect to the service at ${service.url} because ${result.value}`
      if (options.strict) {
        throw new Error(message)
      } else {
        console.error(message)
      }
    }
  }

  return {
    schema,
    entryMap,
  }
}
