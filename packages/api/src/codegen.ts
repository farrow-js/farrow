import { FormatType, FormatTypes, getTypeName, isInlineType } from './formater'
import { FormatEntries, FormatResult, FormatApi } from './toJSON'

const transformComment = (text: string) => {
  return text
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .join('\n*\n*')
}

const attachComment = (result: string, options: { [key: string]: string | undefined }) => {
  let list = Object.entries(options)
    .map(([key, value]) => {
      return value ? `* @${key} ${transformComment(value.trim())}` : ''
    })
    .filter(Boolean)

  if (list.length === 0) return result

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
    return `Array<${getFieldType(fieldType.itemTypeId, types)}>`
  }

  if (fieldType.type === 'Union') {
    return fieldType.itemTypes.map((itemType) => getFieldType(itemType.typeId, types)).join(' | ')
  }

  if (fieldType.type === 'Intersect') {
    return fieldType.itemTypes.map((itemType) => getFieldType(itemType.typeId, types)).join(' & ')
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

        return attachComment(result, {
          remarks: field.description,
          depcreated: field.deprecated,
        })
      })

      let typeName = getTypeName(formatType)

      if (typeName) {
        if (exportSet.has(typeName)) {
          throw new Error(`Duplicate Object type name: ${typeName}`)
        }

        exportSet.add(typeName)

        return `
        /**
         * {@label ${typeName}} 
         */
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

  let handleApi = (api: FormatApi, path: string[]) => {
    let inputType = getFieldType(api.input.typeId, formatResult.types)
    let outputType = getFieldType(api.output.typeId, formatResult.types)
    let sourceText = `
    (input: ${inputType}) => options.fetcher({ path: ${JSON.stringify(path)}, input }) as Promise<${outputType}>
    `
    return { inputType, outputType, sourceText }
  }

  let handleEntries = (entries: FormatEntries, path: string[] = []): string => {
    let fields = Object.entries(entries.entries).map(([key, field]) => {
      if (field.type === 'Api') {
        let { sourceText, inputType, outputType } = handleApi(field, [...path, key])
        let result = `${key}: ${sourceText}`
        return attachComment(result, {
          remarks: field.description,
          depcreated: field.deprecated,
          [`param input -`]: inputType,
          returns: outputType,
        })
      }
      return `${key}: ${handleEntries(field, [...path, key])}`
    })
    return `{ ${fields.join(',\n')} }`
  }

  let definitions = handleTypes(formatResult.types)

  let entries = handleEntries(formatResult.entries)

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

    export type CreateApiClientOptions = {
      /**
       * a fetcher for api-client
       */
      fetcher: (input: { path: string[], input: JsonType }) => Promise<JsonType>
    }

    export const createApiClient = (options: CreateApiClientOptions) => {
      return ${entries}
    }
  `

  return source
}
