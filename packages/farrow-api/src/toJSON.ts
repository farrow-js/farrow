import { toSchemaCtor, SchemaCtorInput } from 'farrow-schema'
import { Formatter, FormatTypes, FormatField, FormatType, FormatContext } from 'farrow-schema/formatter'
import { ApiType, ApiEntries, getContentType, getTypeDescription, getTypeDeprecated, Typeable } from './api'

export type FormatApi = {
  type: 'Api'
  description?: string
  deprecated?: string
  input: FormatField
  output: FormatField
}

export type FormatEntries = {
  type: 'Entries'
  entries: {
    [key: string]: FormatApi | FormatEntries
  }
}

export type FormatResult = {
  protocol: 'Farrow-API'
  types: FormatTypes
  entries: FormatEntries
}

const isApiType = (input: any): input is ApiType => {
  return input?.type === 'Api'
}

export const toJSON = (apiEntries: ApiEntries): FormatResult => {
  const types: FormatTypes = {}

  let uid = 0

  const addType = (type: FormatType): number => {
    const id = uid++
    types[`${id}`] = type
    return id
  }

  const context: FormatContext = {
    addType,
    formatCache: new WeakMap(),
  }

  const formatTypeable = (typeable: Typeable<SchemaCtorInput>): FormatField => {
    const SchemaCtor = toSchemaCtor(getContentType(typeable))
    const formatResult = Formatter.format(SchemaCtor, context)

    return {
      typeId: formatResult.typeId,
      $ref: `#/types/${formatResult.typeId}`,
      description: getTypeDescription(typeable),
      deprecated: getTypeDeprecated(typeable),
    }
  }

  const formatApiType = (apiType: ApiType): FormatApi => {
    const formatEntry: FormatApi = {
      type: 'Api' as const,
      input: formatTypeable(apiType.definition.input),
      output: formatTypeable(apiType.definition.output),
      description: apiType.definition.description,
      deprecated: apiType.definition.deprecated,
    }

    return formatEntry
  }

  const formatApiEntries = (apiEntries: ApiEntries): FormatEntries => {
    const entries: FormatEntries['entries'] = {}
    const formatEntries: FormatEntries = {
      type: 'Entries',
      entries,
    }

    for (const key in apiEntries) {
      const item = apiEntries[key]
      if (isApiType(item)) {
        entries[key] = formatApiType(item)
      } else {
        entries[key] = formatApiEntries(item)
      }
    }

    return formatEntries
  }

  const formatResult: FormatResult = {
    protocol: 'Farrow-API',
    types,
    entries: formatApiEntries(apiEntries),
  }

  return formatResult
}
