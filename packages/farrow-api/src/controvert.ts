import {
  SchemaCtorInput,
  SchemaCtor,
  String,
  ID,
  Number,
  Int,
  Float,
  Boolean,
  Unknown,
  Any,
  Json,
  ObjectType,
  FieldDescriptor,
  Union,
  Intersect,
  Struct,
  FieldDescriptors,
  Record,
  List,
  Tuple,
  Literal,
  Nullable,
  Strict,
  NonStrict,
  ReadOnly,
  ReadOnlyDeep,
} from 'farrow-schema'
import { Api, ApiEntries, ApiType } from './api'
import type {
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
import type { FormatResult, FormatEntries, FormatApi } from './toJSON'

export const controvertEntries = (input: FormatResult): ApiEntries => {
  const types = controvertTypes(input.types)

  const findType = (typeId: number): SchemaCtor => {
    const schemaCtor = types.get(typeId.toString())

    if (!schemaCtor) {
      throw new Error(`Unknown typeId: ${typeId}`)
    }

    return schemaCtor
  }

  const controvertFieldType = (input: FormatField): FieldDescriptor => {
    return {
      __type: findType(input.typeId),
      description: input.description,
      deprecated: input.deprecated,
    }
  }

  const controvertApi = (input: FormatApi): ApiType => {
    return Api({
      input: controvertFieldType(input.input),
      output: controvertFieldType(input.output),
      description: input.description,
      deprecated: input.deprecated,
    })
  }

  const controvertEntries = (input: FormatEntries): ApiEntries => {
    const entries: ApiEntries = {}

    for (const name in input.entries) {
      const item = input.entries[name as keyof typeof input.entries]
      if (item.type === 'Api') {
        entries[name] = controvertApi(item)
      } else {
        entries[name] = controvertEntries(item)
      }
    }

    return entries
  }

  return controvertEntries(input.entries)
}

export const controvertTypes = (input: FormatTypes): Map<string, SchemaCtor> => {
  const controvertType = (input: FormatType): SchemaCtor => {
    switch (input.type) {
      case 'Scalar': {
        return controvertScalarType(input)
      }
      case 'Object': {
        return controvertObjectType(input)
      }
      case 'Union': {
        return controvertUnionType(input)
      }
      case 'Intersect': {
        return controvertIntersectType(input)
      }
      case 'Struct': {
        return controvertStructType(input)
      }
      case 'Record': {
        return controvertRecordType(input)
      }
      case 'List': {
        return controvertListType(input)
      }
      case 'Tuple': {
        return controvertTupleType(input)
      }
      case 'Literal': {
        return controvertLiteralType(input)
      }
      case 'Nullable': {
        return controvertNullableType(input)
      }
      case 'Strict': {
        return controvertStrictType(input)
      }
      case 'NonStrict': {
        return controvertNonStrictType(input)
      }
      case 'ReadOnly': {
        return controvertReadOnlyType(input)
      }
      case 'ReadOnlyDeep': {
        return controvertReadOnlyDeepType(input)
      }
      // for eslint
      default: {
        throw new Error(`Unknown format type: ${input}`)
      }
    }
  }

  const controvertScalarType = (input: FormatScalarType): SchemaCtor => {
    switch (input.valueName) {
      case 'String':
        return String
      case 'ID':
        return ID
      case 'Number':
        return Number
      case 'Int':
        return Int
      case 'Float':
        return Float
      case 'Boolean':
        return Boolean
      case 'Date':
        return Date
      case 'Unknown':
        return Unknown
      case 'Any':
        return Any
      case 'Json':
        return Json
      default:
        throw new Error(`Unknown Scalar Type name: ${input.valueName}`)
    }
  }

  const controvertObjectType = (input: FormatObjectType): SchemaCtor => {
    const fields = controvertFieldsType(input.fields)

    return class Obj extends ObjectType {
      constructor() {
        super()

        for (const name in fields) {
          this[name] = fields[name]
        }
      }
    }
  }

  const controvertFieldsType = (input: FormatFields): FieldDescriptors => {
    const fields: FieldDescriptors = {}

    for (const name in input) {
      fields[name] = controvertFieldType(input[name])
    }

    return fields
  }

  const controvertFieldType = (input: FormatField): FieldDescriptor => {
    return {
      __type: findType(input.typeId),
      description: input.description,
      deprecated: input.deprecated,
    }
  }

  const controvertUnionType = (input: FormatUnionType): SchemaCtor => {
    const items: SchemaCtorInput[] = input.itemTypes.map(({ typeId }) => findType(typeId))
    return Union(...items)
  }

  const controvertIntersectType = (input: FormatIntersectType): SchemaCtor => {
    const items: SchemaCtorInput[] = input.itemTypes.map(({ typeId }) => findType(typeId))
    return Intersect(...items)
  }

  const controvertStructType = (input: FormatStructType): SchemaCtor => {
    const fields = controvertFieldsType(input.fields)
    return Struct(fields)
  }

  const controvertRecordType = (input: FormatRecordType): SchemaCtor => {
    const item = findType(input.valueTypeId)
    return Record(item)
  }

  const controvertListType = (input: FormatListType): SchemaCtor => {
    const item = findType(input.itemTypeId)
    return List(item)
  }

  const controvertTupleType = (input: FormatTupleType): SchemaCtor => {
    const items: SchemaCtorInput[] = input.itemTypes.map(({ typeId }) => findType(typeId))
    return Tuple(...items)
  }

  const controvertLiteralType = (input: FormatLiteralType): SchemaCtor => {
    return Literal(input.value)
  }

  const controvertNullableType = (input: FormatNullableType): SchemaCtor => {
    const item = findType(input.itemTypeId)
    return Nullable(item)
  }

  const controvertStrictType = (input: FormatStrictType): SchemaCtor => {
    const item = findType(input.itemTypeId)
    return Strict(item)
  }

  const controvertNonStrictType = (input: FormatNonStrictType): SchemaCtor => {
    const item = findType(input.itemTypeId)
    return NonStrict(item)
  }

  const controvertReadOnlyType = (input: FormatReadOnlyType): SchemaCtor => {
    const item = findType(input.itemTypeId)
    return ReadOnly(item)
  }

  const controvertReadOnlyDeepType = (input: FormatReadonlyDeepType): SchemaCtor => {
    const item = findType(input.itemTypeId)
    return ReadOnlyDeep(item)
  }

  const findType = (typeId: number): SchemaCtor => {
    const schemaCtor = types.get(typeId.toString())

    if (!schemaCtor) {
      throw new Error(`Unknown typeId: ${typeId}`)
    }

    return schemaCtor
  }

  const types = new Map<string, SchemaCtor>()

  for (const id in input) {
    types.set(id, controvertType(input[id]))
  }

  return types
}
