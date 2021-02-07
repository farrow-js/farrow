import { FormatField, FormatType, FormatTypes, isPrimitive } from './formater'
import { FormatEntries, FormatResult, FormatApi } from './toJSON'

const attachInfoIfNeeded = (result: string, options: { description?: string; deprecated?: string }) => {
  if (options.deprecated) {
    result = `// @depcreated ${options.deprecated}\n${result}`
  }

  if (options.description) {
    result = `// @remarks ${options.description}\n${result}`
  }

  return result
}

export const codegen = (formatResult: FormatResult): string => {
  let exportSet = new Set<string>()

  let getType = (typeId: number | string): string => {
    return `Type${typeId}`
  }

  let getFieldType = (field: FormatField) => {
    let fieldType = formatResult.types[field.typeId]

    if (!isPrimitive(fieldType)) {
      return getType(field.typeId)
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
      return `Record<string, ${getType(field.typeId)}>`
    }

    if (fieldType.type === 'Unknown') {
      return 'unknown'
    }

    throw new Error(`Unsupported field: ${JSON.stringify(fieldType, null, 2)}`)
  }

  let handleType = (typeId: string, formatType: FormatType) => {
    if (isPrimitive(formatType)) {
      return ''
    }

    if (formatType.type === 'Nullable') {
      return `type ${getType(typeId)} = ${getType(formatType.itemTypeId)} | null | undefined`
    }

    if (formatType.type === 'List') {
      return `type ${getType(typeId)} = ${getType(formatType.itemTypeId)}[]`
    }

    if (formatType.type === 'Union') {
      return `
       type ${getType(typeId)} = ${formatType.itemTypeIds.map(getType).join(' | ')}
      `
    }

    if (formatType.type === 'Intersect') {
      return `
       type ${getType(typeId)} = ${formatType.itemTypeIds.map(getType).join(' & ')}
      `
    }

    if (formatType.type === 'Literal') {
      let literal = typeof formatType.value === 'string' ? `"${formatType.value}"` : formatType.value
      return `type ${getType(typeId)} = ${literal}`
    }

    if (formatType.type === 'Object' || formatType.type === 'Struct') {
      let fileds = Object.entries(formatType.fields).map(([key, field]) => {
        let result = `${key}: ${getFieldType(field)}`

        return attachInfoIfNeeded(result, field)
      })

      if (formatType.type === 'Object' && formatType.name) {
        if (exportSet.has(formatType.name)) {
          throw new Error(`Duplicate Object Type name: ${formatType.name}`)
        }

        exportSet.add(formatType.name)

        return `
        export type ${formatType.name} = {
          ${fileds.join(',  \n')}
        }
        type ${getType(typeId)} = ${formatType.name}
        `
      }

      return `type ${getType(typeId)} = {
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

  let handleApi = (api: FormatApi): string => {
    let inputType = getType(api.input.typeId)
    let outputType = getType(api.output.typeId)
    let result = `(input: ${inputType}) => Promise<${outputType}>`

    return result
  }

  let handleEntries = (entries: FormatEntries): string => {
    let fields = Object.entries(entries.entries).map(([key, field]) => {
      if (field.type === 'Api') {
        let result = `${key}: ${handleApi(field)}`
        return attachInfoIfNeeded(result, field)
      }
      return `${key}: ${handleEntries(field)}`
    })
    return `
    {
      ${fields.join(',\n')}
    }
    `
  }

  let definitions = handleTypes(formatResult.types)

  let entries = handleEntries(formatResult.entries)

  let hasJsonType = Object.values(formatResult.types).some((item) => item.type === 'JSON')

  let sourceOfJsonType = `
  type JsonType =
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
  `

  let source = `

  type Prettier<T> = T extends Promise<infer U>
    ? Promise<Prettier<U>>
    : T extends (...args: infer Args) => infer Return
    ? (...args: Prettier<Args>) => Prettier<Return>
    : T extends object | any[]
    ? {
        [key in keyof T]: Prettier<T[key]>
      }
    : T

    ${hasJsonType ? sourceOfJsonType : ''}

    ${definitions.join('\n')}

    export type __OriginalAPI__ = ${entries}

    export type __API__ = Prettier<__OriginalAPI__>
  `

  return source
}
