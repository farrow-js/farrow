import {
  FormatAnyType,
  FormatBooleanType,
  FormatFields,
  FormatFloatType,
  FormatIDType,
  FormatIntersectType,
  FormatIntType,
  FormatJsonType,
  FormatListType,
  FormatLiteralType,
  FormatNullableType,
  FormatNumberType,
  FormatRecordType,
  FormatStringType,
  FormatStructType,
  FormatType,
  FormatTypes,
  FormatUnionType,
  FormatUnknownType,
} from 'farrow-schema/formater'
import { FormatEntries, FormatResult, FormatApi } from './toJSON'

export type FormatInlineTypes =
  | FormatNumberType
  | FormatIntType
  | FormatFloatType
  | FormatStringType
  | FormatIDType
  | FormatBooleanType
  | FormatJsonType
  | FormatAnyType
  | FormatUnknownType
  | FormatRecordType
  | FormatLiteralType
  | FormatNullableType
  | FormatUnionType
  | FormatIntersectType
  | FormatListType
  | FormatStructType

export const InlineTypes = [
  'Number',
  'Int',
  'Float',
  'String',
  'ID',
  'Boolean',
  'JSON',
  'Any',
  'Unknown',
  'Literal',
  'Nullable',
  'List',
  'Union',
  'Intersect',
  'Record',
  'Struct',
]

export const isInlineType = (input: FormatType): input is FormatInlineTypes => {
  return InlineTypes.includes(input?.type ?? '')
}

const getTypeName = (input: FormatType): string | null => {
  if (input.type === 'Object' && input.name) {
    return input.name
  }
  return null
}

const transformComment = (text: string) => {
  return text
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .join('\n*\n* ')
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

  if (fieldType.type === 'Json') {
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
    return `Record<string, ${getFieldType(fieldType.valueTypeId, types)}>`
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
    return `(${getFieldType(fieldType.itemTypeId, types)})[]`
  }

  if (fieldType.type === 'Union') {
    return fieldType.itemTypes.map((itemType) => getFieldType(itemType.typeId, types)).join(' | ')
  }

  if (fieldType.type === 'Intersect') {
    return fieldType.itemTypes.map((itemType) => getFieldType(itemType.typeId, types)).join(' & ')
  }

  if (fieldType.type === 'Struct') {
    return `{
      ${getFieldsType(fieldType.fields, types).join(',\n')}
    }`
  }

  throw new Error(`Unsupported field: ${JSON.stringify(fieldType, null, 2)}`)
}

const getFieldsType = (fields: FormatFields, types: FormatTypes): string[] => {
  return Object.entries(fields).map(([key, field]) => {
    let result = `${key}: ${getFieldType(field.typeId, types)}`

    return attachComment(result, {
      remarks: field.description,
      deprecated: field.deprecated,
    })
  })
}

export type CodegenOptions = {
  emitApiClient?: boolean
}

export const codegen = (formatResult: FormatResult, options?: CodegenOptions): string => {
  let config = {
    emitApiClient: true,
    ...options,
  }

  let exportSet = new Set<string>()

  let handleType = (formatType: FormatType): string => {
    if (isInlineType(formatType)) {
      return ''
    }

    if (formatType.type === 'Object') {
      let typeName = formatType.name
      let fields = getFieldsType(formatType.fields, formatResult.types)

      if (exportSet.has(typeName)) {
        throw new Error(`Duplicate Object type name: ${typeName}`)
      }

      exportSet.add(typeName)

      return `
      /**
       * {@label ${typeName}} 
       */
      export type ${typeName} = {
        ${fields.join(',  \n')}
      }
      `
    }

    throw new Error(`Unsupported type of ${JSON.stringify(formatType, null, 2)}`)
  }

  let handleTypes = (formatTypes: FormatTypes) => {
    return Object.values(formatTypes).map((formatType) => handleType(formatType))
  }

  let handleApi = (api: FormatApi, path: string[]) => {
    let inputType = getFieldType(api.input.typeId, formatResult.types)
    let outputType = getFieldType(api.output.typeId, formatResult.types)
    return `
      (input: ${inputType}) => options.fetcher({ path: ${JSON.stringify(path)}, input }) as Promise<${outputType}>
    `
  }

  let handleEntries = (entries: FormatEntries, path: string[] = []): string => {
    let fields = Object.entries(entries.entries).map(([key, field]) => {
      if (field.type === 'Api') {
        let sourceText = handleApi(field, [...path, key])
        let result = `${key}: ${sourceText}`
        return attachComment(result, {
          remarks: field.description,
          deprecated: field.deprecated,
          [`param input -`]: field.input.description,
          returns: field.output.description,
        })
      }
      return `${key}: ${handleEntries(field, [...path, key])}`
    })

    return `{ ${fields.join(',\n')} }`
  }

  let definitions = handleTypes(formatResult.types)

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

  `

  if (config.emitApiClient) {
    let entries = handleEntries(formatResult.entries)
    source += `
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
  }

  return source
}
