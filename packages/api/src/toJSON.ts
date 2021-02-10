import { toSchemaCtor, SchemaCtorInput } from 'farrow-schema'
import { FormatTypes, createSchemaFormater, FormatField, FormatType, FormatObjectType } from './formater'
import { ApiType, ApiEntries, getContentType, getTypeDescription, getTypeDeprecated, Typable } from './api'

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
  types: FormatTypes
  entries: FormatEntries
}

const isApiType = (input: any): input is ApiType => {
  return input?.type === 'Api'
}

export const toJSON = (apiEntries: ApiEntries): FormatResult => {
  let types: FormatTypes = {}

  let uid = 0

  let objectTypeList = [] as FormatObjectType[]

  let addType = (type: FormatType): number => {
    let id = uid++
    types[`${id}`] = type
    if (type.type === 'Object') {
      objectTypeList.push(type)
    }
    return id
  }

  let context = {
    addType,
    writerCache: new WeakMap(),
  }

  let formatTypable = (typable: Typable<SchemaCtorInput>): FormatField => {
    let SchemaCtor = toSchemaCtor(getContentType(typable))
    let formatResult = createSchemaFormater(SchemaCtor, context)

    return {
      typeId: formatResult.typeId,
      description: getTypeDescription(typable),
      deprecated: getTypeDeprecated(typable),
    }
  }

  let formatApiType = (apiType: ApiType): FormatApi => {
    let formatEntry: FormatApi = {
      type: 'Api' as const,
      input: formatTypable(apiType.definition.input),
      output: formatTypable(apiType.definition.output),
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
    types,
    entries: formatApiEntries(apiEntries),
  }

  // trigger all lazy fields to expand formatResult.types
  while (objectTypeList.length) {
    let objectType = objectTypeList.shift()
    objectType?.fields
  }

  return formatResult
}
