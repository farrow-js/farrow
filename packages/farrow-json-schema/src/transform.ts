import { toSchemaCtor, isSchemaCtor, FieldDescriptor } from 'farrow-schema'
import {
  formatSchema,
  FormatTypes,
  FormatType,
  FormatScalarType,
  FormatObjectType,
  FormatFields,
  FormatField,
  FormatUnionType,
  FormatIntersectType,
  FormatStructType,
  FormatRecordType,
  FormatListType,
  FormatTupleType,
  FormatLiteralType,
  FormatNullableType,
  FormatStrictType,
  FormatNonStrictType,
  FormatReadOnlyType,
  FormatReadonlyDeepType,
} from 'farrow-schema/formatter'
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema'

export type FormatResult = {
  typeId: number
  types: FormatTypes
}

export const transform = (input: FieldDescriptor): JSONSchema7 => {
  if (isSchemaCtor(input)) {
    const schemaCtor = toSchemaCtor(input)
    const formatResult = formatSchema(schemaCtor)
    return transformResult(formatResult)
    // eslint-disable-next-line no-else-return
  } else {
    const schemaCtor = toSchemaCtor(input.__type)
    const formatResult = formatSchema(schemaCtor)
    return {
      ...transformResult(formatResult),
      description: input.description,
    }
  }
}

export const transformResult = (formatResult: FormatResult): JSONSchema7 => {
  const transformType = (input: FormatType): JSONSchema7 => {
    switch (input.type) {
      case 'Scalar': {
        return transformScalarType(input)
      }
      case 'Object': {
        return transformObjectType(input)
      }
      case 'Union': {
        return transformUnionType(input)
      }
      case 'Intersect': {
        return transformIntersectType(input)
      }
      case 'Struct': {
        return transformStructType(input)
      }
      case 'Record': {
        return transformRecordType(input)
      }
      case 'List': {
        return transformListType(input)
      }
      case 'Tuple': {
        return transformTupleType(input)
      }
      case 'Literal': {
        return transformLiteralType(input)
      }
      case 'Nullable': {
        return transformNullableType(input)
      }
      case 'Strict': {
        return transformStrictType(input)
      }
      case 'NonStrict': {
        return transformNonStrictType(input)
      }
      case 'ReadOnly': {
        return transformReadOnlyType(input)
      }
      case 'ReadOnlyDeep': {
        return transformReadOnlyDeepType(input)
      }
      // for eslint
      default: {
        throw new Error(`Unknown format type: ${input}`)
      }
    }
  }

  const transformScalarType = (input: FormatScalarType): JSONSchema7 => {
    switch (input.valueName) {
      case 'String':
        return {
          type: 'string',
        }
      case 'ID':
        return {
          type: 'integer',
        }
      case 'Number':
        return {
          type: 'number',
        }
      case 'Int':
        return {
          type: 'integer',
        }
      case 'Float':
        return {
          type: 'number',
        }
      case 'Boolean':
        return {
          type: 'boolean',
        }
      case 'Date':
        return {
          type: 'string',
        }
      case 'Unknown':
        return {}
      case 'Any':
        return {}
      case 'Json':
        return {}
      default:
        throw new Error(`Unknown Scalar Type name: ${input.valueName}`)
    }
  }

  const transformObjectType = (input: FormatObjectType): JSONSchema7 => {
    const fields = transformFieldsType(input.fields)
    return {
      ...fields,
      type: 'object',
    }
  }

  type Properties = {
    [key: string]: JSONSchema7Definition
  }
  const transformFieldsType = (input: FormatFields): JSONSchema7 => {
    const properties: Properties = {}

    for (const name in input) {
      properties[name] = transformFieldType(input[name])
    }

    return {
      properties,
    }
  }

  const transformFieldType = (input: FormatField): JSONSchema7 => {
    return {
      ...findSchema(input.typeId),
      description: input.description,
    }
  }

  const transformUnionType = (input: FormatUnionType): JSONSchema7 => {
    const items: JSONSchema7[] = input.itemTypes.map(({ typeId }) => findSchema(typeId))
    return {
      oneOf: items,
    }
  }

  const transformIntersectType = (input: FormatIntersectType): JSONSchema7 => {
    const items: JSONSchema7[] = input.itemTypes.map(({ typeId }) => findSchema(typeId))

    const properties: Properties = {}
    for (const item of items) {
      if (item.properties) {
        for (const key in item.properties) {
          properties[key] = item.properties[key]
        }
      }
    }

    return {
      type: 'object',
      properties,
    }
  }

  const transformStructType = (input: FormatStructType): JSONSchema7 => {
    const fields = transformFieldsType(input.fields)
    return {
      type: 'object',
      ...fields,
    }
  }

  const transformRecordType = (input: FormatRecordType): JSONSchema7 => {
    const item = findSchema(input.valueTypeId)
    return {
      type: 'object',
      additionalProperties: item,
    }
  }

  const transformListType = (input: FormatListType): JSONSchema7 => {
    const item = findSchema(input.itemTypeId)
    return {
      type: 'array',
      additionalItems: item,
    }
  }

  const transformTupleType = (input: FormatTupleType): JSONSchema7 => {
    const items = input.itemTypes.map(({ typeId }) => findSchema(typeId))
    return {
      type: 'array',
      items,
    }
  }

  const transformLiteralType = (input: FormatLiteralType): JSONSchema7 => {
    return {
      const: [input.value!],
    }
  }

  const transformNullableType = (input: FormatNullableType): JSONSchema7 => {
    const item = findSchema(input.itemTypeId)
    return {
      anyOf: [
        item,
        {
          const: [null],
        },
      ],
    }
  }

  const transformStrictType = (input: FormatStrictType): JSONSchema7 => {
    const item = findSchema(input.itemTypeId)
    return item
  }

  const transformNonStrictType = (input: FormatNonStrictType): JSONSchema7 => {
    const item = findSchema(input.itemTypeId)
    return item
  }

  const transformReadOnlyType = (input: FormatReadOnlyType): JSONSchema7 => {
    const item = findSchema(input.itemTypeId)
    return item
  }

  const transformReadOnlyDeepType = (input: FormatReadonlyDeepType): JSONSchema7 => {
    const item = findSchema(input.itemTypeId)
    return item
  }

  const schemas = new Map<string, JSONSchema7>()

  const findSchema = (typeId: number): JSONSchema7 => {
    const schema = schemas.get(typeId.toString())

    if (!schema) {
      const item = findType(typeId)
      const schema = transformType(item)
      schemas.set(`${typeId}`, schema)
    }

    return {
      $ref: `#/definitions/${typeId}`,
    }
  }

  const findType = (typeId: number): FormatType => {
    for (const key in formatResult.types) {
      if (key === `${typeId}`) {
        return formatResult.types[key]
      }
    }

    throw new Error(`Unknown typeId: ${typeId}`)
  }

  for (const id in formatResult.types) {
    if (!schemas.has(id)) {
      schemas.set(id, {
        $id: id,
        ...transformType(formatResult.types[id]),
      })
    }
  }

  const definitions = Object.fromEntries(schemas)

  return {
    $id: '/farrow/schema',
    definitions,
    ...findSchema(formatResult.typeId),
  }
}
