import { FormatType, FormatTypes, getTypeName, isInlineType } from './formater'
import { FormatEntries, FormatResult, FormatApi } from './toJSON'

const attachComment = (result: string, options: { description?: string; deprecated?: string }) => {
  if (!options.deprecated && !options.description) {
    return result
  }

  let list = [
    options.description ? `* @remarks ${options.description}` : '',
    options.deprecated ? `* @depcreated ${options.deprecated}` : '',
  ].filter(Boolean)

  let comment = `/**\n${list.join('\n')}\n*/\n`

  return comment + result
}

const getTypeNameById = (typeId: number | string): string => {
  return `Type${typeId}`
}

const getFieldType = (typeId: number, types: FormatTypes): string => {
  let fieldType = types[typeId]

  let typeName = getTypeName(fieldType)

  if (typeName) {
    return typeName
  }

  if (!isInlineType(fieldType)) {
    return getTypeNameById(typeId)
  }

  if (fieldType.type === 'Any') {
    return 'any'
  }

  if (fieldType.type === 'JSON') {
    return 'JsonType'
  }

  if (fieldType.type === 'String') {
    return 'string'
  }

  if (fieldType.type === 'Boolean') {
    return 'boolean'
  }

  if (fieldType.type === 'Float') {
    return 'number'
  }

  if (fieldType.type === 'ID') {
    return 'string'
  }

  if (fieldType.type === 'Int') {
    return 'number'
  }

  if (fieldType.type === 'Number') {
    return 'number'
  }

  if (fieldType.type === 'Record') {
    return `Record<string, ${getFieldType(typeId, types)}>`
  }

  if (fieldType.type === 'Unknown') {
    return 'unknown'
  }

  if (fieldType.type === 'Literal') {
    let literal = typeof fieldType.value === 'string' ? `"${fieldType.value}"` : fieldType.value
    return `${literal}`
  }

  if (fieldType.type === 'Nullable') {
    return `${getFieldType(fieldType.itemTypeId, types)} | null | undefined`
  }

  if (fieldType.type === 'List') {
    return `${getFieldType(fieldType.itemTypeId, types)}[]`
  }

  if (fieldType.type === 'Union') {
    return fieldType.itemTypeIds.map((typeId) => getFieldType(typeId, types)).join(' | ')
  }

  if (fieldType.type === 'Intersect') {
    return fieldType.itemTypeIds.map((typeId) => getFieldType(typeId, types)).join(' & ')
  }

  throw new Error(`Unsupported field: ${JSON.stringify(fieldType, null, 2)}`)
}

export const codegen = (formatResult: FormatResult): string => {
  let exportSet = new Set<string>()

  let handleType = (typeId: string, formatType: FormatType) => {
    if (isInlineType(formatType)) {
      return ''
    }

    if (formatType.type === 'Object' || formatType.type === 'Struct') {
      let fileds = Object.entries(formatType.fields).map(([key, field]) => {
        let result = `${key}: ${getFieldType(field.typeId, formatResult.types)}`

        return attachComment(result, field)
      })

      let typeName = getTypeName(formatType)

      if (typeName) {
        if (exportSet.has(typeName)) {
          throw new Error(`Duplicate Object Type name: ${typeName}`)
        }

        exportSet.add(typeName)

        return `
        export type ${typeName} = {
          ${fileds.join(',  \n')}
        }
        `
      }

      return `type ${getTypeNameById(typeId)} = {
        ${fileds.join(',  \n')}
      }
      `
    }

    throw new Error(`Unsupported type of ${JSON.stringify(formatType, null, 2)}`)
  }

  let handleTypes = (formatTypes: FormatTypes) => {
    return Object.entries(formatTypes).map(([typeId, formatType]) => {
      return handleType(typeId, formatType)
    })
  }

  let handleApiType = (api: FormatApi): string => {
    let inputType = getFieldType(api.input.typeId, formatResult.types)
    let outputType = getFieldType(api.output.typeId, formatResult.types)
    let result = `(input: ${inputType}) => Promise<${outputType}>`

    return result
  }

  let handleEntriesType = (entries: FormatEntries): string => {
    let fields = Object.entries(entries.entries).map(([key, field]) => {
      if (field.type === 'Api') {
        let result = `${key}: ${handleApiType(field)}`
        return attachComment(result, field)
      }
      return `${key}: ${handleEntriesType(field)}`
    })
    return `
    {
      ${fields.join(',\n')}
    }
    `
  }

  let handleApiImpl = (api: FormatApi, path: string[]): string => {
    let inputType = getFieldType(api.input.typeId, formatResult.types)
    let outputType = getFieldType(api.output.typeId, formatResult.types)
    let result = `
    (input: ${inputType}) => {
      return options.fetcher({ path: ${JSON.stringify(path)}, input }) as Promise<${outputType}>
    }
    `
    return result
  }

  let handleEntriesImpl = (entries: FormatEntries, path: string[] = []): string => {
    let fields = Object.entries(entries.entries).map(([key, field]) => {
      if (field.type === 'Api') {
        let result = `${key}: ${handleApiImpl(field, [...path, key])}`
        return attachComment(result, field)
      }
      return `${key}: ${handleEntriesImpl(field, [...path, key])}`
    })
    return `{ ${fields.join(',\n')} }`
  }

  let definitions = handleTypes(formatResult.types)

  let entriesType = handleEntriesType(formatResult.entries)

  let entriesImpl = handleEntriesImpl(formatResult.entries)

  let source = `
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

    ${definitions.join('\n\n')}

    export type __Api__ = ${entriesType}

    export type CreateApiOptions = {
      fetcher: (input: JsonType) => Promise<JsonType>
    }

    export const createApiClient = (options: CreateApiOptions) => {
      return ${entriesImpl}
    }
  `

  return source
}
