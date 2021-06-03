import type { FormatEntries, FormatResult, FormatApi } from 'farrow-api/dist/toJSON'
import { FormatFields, FormatType, FormatTypes, isNamedFormatType } from 'farrow-schema/formatter'
import type { CodegenOptions } from 'farrow-api/dist/codegen'

export const isInlineType = (input: FormatType) => {
  if (isNamedFormatType(input)) {
    return !input.name
  }
  return true
}

const getTypeName = (input: FormatType): string | null => {
  if (isNamedFormatType(input) && input.name) {
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
  const list = Object.entries(options)
    .map(([key, value]) => {
      return value ? `* @${key} ${transformComment(value.trim())}` : ''
    })
    .filter(Boolean)

  if (list.length === 0) return result

  const comment = `/**\n${list.join('\n')}\n*/\n`

  return comment + result
}

const getTypeNameById = (typeId: number | string): string => {
  return `Type${typeId}`
}

const getFieldType = (typeId: number, types: FormatTypes): string => {
  const fieldType = types[typeId]

  const typeName = getTypeName(fieldType)

  if (typeName) {
    return typeName
  }

  if (!isInlineType(fieldType)) {
    return getTypeNameById(typeId)
  }

  if (fieldType.type === 'Scalar') {
    return fieldType.valueType
  }

  if (fieldType.type === 'Record') {
    return `Record<string, ${getFieldType(fieldType.valueTypeId, types)}>`
  }

  if (fieldType.type === 'Literal') {
    const literal = typeof fieldType.value === 'string' ? `"${fieldType.value}"` : fieldType.value
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

  if (
    fieldType.type === 'Strict' ||
    fieldType.type === 'NonStrict' ||
    fieldType.type === 'ReadOnly' ||
    fieldType.type === 'ReadOnlyDeep'
  ) {
    return getFieldType(fieldType.itemTypeId, types)
  }

  if (fieldType.type === 'Tuple') {
    return `[${fieldType.itemTypes.map((itemType) => getFieldType(itemType.typeId, types)).join(', ')}]`
  }

  throw new Error(`Unsupported field: ${JSON.stringify(fieldType, null, 2)}`)
}

const getFieldsType = (fields: FormatFields, types: FormatTypes): string[] => {
  return Object.entries(fields).map(([key, field]) => {
    const fieldType = types[field.typeId]
    let result = ''

    if (fieldType.type === 'Nullable') {
      result = `${key}?: ${getFieldType(field.typeId, types)}`
    } else {
      result = `${key}: ${getFieldType(field.typeId, types)}`
    }

    return attachComment(result, {
      remarks: field.description,
      deprecated: field.deprecated,
    })
  })
}

export const codegen = (formatResult: FormatResult, options?: CodegenOptions): string => {
  const config = {
    emitApiClient: true,
    ...options,
  }

  const exportSet = new Set<string>()

  const handleType = (formatType: FormatType): string => {
    if (isInlineType(formatType)) {
      return ''
    }

    if (formatType.type === 'Object' || formatType.type === 'Struct') {
      const typeName = formatType.name!
      const fields = getFieldsType(formatType.fields, formatResult.types)

      if (!typeName) {
        throw new Error(`Empty name of Object/Struct, fields: {${Object.keys(formatType.fields)}}`)
      }

      if (exportSet.has(typeName)) {
        throw new Error(`Duplicate Object/Struct type name: ${typeName}`)
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

    if (formatType.type === 'Union') {
      const typeName = formatType.name!
      const expression = formatType.itemTypes
        .map((itemType) => getFieldType(itemType.typeId, formatResult.types))
        .join(' | ')
      return `
      /**
       * {@label ${typeName}} 
       */
      export type ${typeName} = ${expression}
      `
    }

    if (formatType.type === 'Intersect') {
      const typeName = formatType.name!
      const expression = formatType.itemTypes
        .map((itemType) => getFieldType(itemType.typeId, formatResult.types))
        .join(' & ')
      return `
      /**
       * {@label ${typeName}} 
       */
      export type ${typeName} = ${expression}
      `
    }

    if (formatType.type === 'Tuple') {
      const typeName = formatType.name!
      const expression = `[${formatType.itemTypes
        .map((itemType) => getFieldType(itemType.typeId, formatResult.types))
        .join(', ')}]`

      return `
        /**
         * {@label ${typeName}} 
         */
        export type ${typeName} = ${expression}
        `
    }

    throw new Error(`Unsupported type of ${JSON.stringify(formatType, null, 2)}`)
  }

  const handleTypes = (formatTypes: FormatTypes) => {
    return Object.values(formatTypes).map((formatType) => handleType(formatType))
  }

  const handleApi = (api: FormatApi, path: string[]) => {
    const inputType = getFieldType(api.input.typeId, formatResult.types)
    const outputType = getFieldType(api.output.typeId, formatResult.types)
    return `
      (input: ${inputType}) => invoke({ type: 'Single', path: ${JSON.stringify(
      path,
    )}, input }) as Promise<${outputType}>
    `
  }

  const handleEntries = (entries: FormatEntries, path: string[] = []): string => {
    const fields = Object.entries(entries.entries).map(([key, field]) => {
      if (field.type === 'Api') {
        const sourceText = handleApi(field, [...path, key])
        const result = `${key}: ${sourceText}`
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

  const definitions = handleTypes(formatResult.types)

  let source = definitions.join('\n\n')

  source = `
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

  ${source}
  `

  if (config.emitApiClient) {
    const entries = handleEntries(formatResult.entries)
    source = `
    export type SingleCalling = {
      type: 'Single'
      path: string[]
      input: Readonly<JsonType>
    }
    
    export type ApiRequest = {
      url: string
      calling: SingleCalling
      options?: RequestInit
    }
    
    export type ApiErrorResponse = {
      type: 'ApiErrorResponse'
      error: {
        message: string
      }
    }
    
    export type ApiSuccessResponse = {
      type: 'ApiSuccessResponse'
      output: JsonType
    }
    
    export type ApiResponse = ApiErrorResponse | ApiSuccessResponse
    
    
    export const fetcher = async (request: ApiRequest): Promise<ApiResponse> => {
      const { url, calling, options: init } = request
      const options: RequestInit = {
        method: 'POST',
        credentials: 'include',
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
        body: JSON.stringify(calling),
      }
      const response = await fetch(url, options)
      const text = await response.text()
      const json = JSON.parse(text) as ApiResponse
    
      return json
    }
    
    export const invoke = async (calling: SingleCalling): Promise<JsonType> => {
      const result = await fetcher({ url, calling }).catch((err) => {
        throw err
      })
    
      const handleResult = (apiResponse: ApiResponse): JsonType => {
        if (apiResponse.type === 'ApiErrorResponse') {
          throw new Error(apiResponse.error.message)
        }
    
        return apiResponse.output
      }
      return handleResult(result)
    }

    export const url = "${options?.url ?? ''}"

    ${source}

    export const api = ${entries}
    `
  }

  source = `
  /**
   * This file was generated by farrow-deno-server
   * Don't modify it manually
   */
  ${source}
  `
  if (options?.noCheck) {
    if (typeof options.noCheck === 'string') {
      source = `
      // @ts-nocheck ${options.noCheck}
      ${source}
      `
    } else {
      source = `
      // @ts-nocheck
      ${source}
      `
    }
  }

  return source
}
