import { toSchemaCtor, SchemaCtorInput } from 'farrow-schema'
import { Formater, FormatTypes, FormatField, FormatType, FormatContext } from 'farrow-schema/dist/newFormater'
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
  let types: FormatTypes = {}

  let uid = 0

  let addType = (type: FormatType): number => {
    let id = uid++
    types[`${id}`] = type
    return id
  }

  let context: FormatContext = {
    addType,
    formatCache: new WeakMap(),
  }

  let formatTypeable = (typeable: Typeable<SchemaCtorInput>): FormatField => {
    let SchemaCtor = toSchemaCtor(getContentType(typeable))
    let formatResult = Formater.format(SchemaCtor, context)

    return {
      typeId: formatResult.typeId,
      $ref: `#/types/${formatResult.typeId}`,
      description: getTypeDescription(typeable),
      deprecated: getTypeDeprecated(typeable),
    }
  }

  let formatApiType = (apiType: ApiType): FormatApi => {
    let formatEntry: FormatApi = {
      type: 'Api' as const,
      input: formatTypeable(apiType.definition.input),
      output: formatTypeable(apiType.definition.output),
      description: apiType.definition.description,
      deprecated: apiType.definition.deprecated,
    }

    return formatEntry
  }

  let formatApiEntries = (apiEntries: ApiEntries): FormatEntries => {
    let entries: FormatEntries['entries'] = {}
    let formatEntries: FormatEntries = {
      type: 'Entries',
      entries,
    }

    for (let key in apiEntries) {
      let item = apiEntries[key]
      if (isApiType(item)) {
        entries[key] = formatApiType(item)
      } else {
        entries[key] = formatApiEntries(item)
      }
    }

    return formatEntries
  }

  let formatResult: FormatResult = {
    protocol: 'Farrow-API',
    types,
    entries: formatApiEntries(apiEntries),
  }

  return formatResult
}
