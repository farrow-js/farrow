import { Literals } from './schema'
import * as Schema from './schema'
import { createTransformer, TransformRule, TransformContext } from './transformer'

export type FormatField = {
  typeId: number
  $ref: string
  description?: string
  deprecated?: string
}

export type FormatFields = {
  [key: string]: FormatField
}

export type FormatObjectType = {
  type: 'Object'
  name: string
  fields: FormatFields
}

export type FormatStructType = {
  type: 'Struct'
  fields: FormatFields
}

export type FormatNumberType = {
  type: 'Number'
}

export type FormatIntType = {
  type: 'Int'
}

export type FormatFloatType = {
  type: 'Float'
}

export type FormatStringType = {
  type: 'String'
}

export type FormatIDType = {
  type: 'ID'
}

export type FormatBooleanType = {
  type: 'Boolean'
}

export type FormatJsonType = {
  type: 'Json'
}

export type FormatAnyType = {
  type: 'Any'
}

export type FormatUnknownType = {
  type: 'Unknown'
}

export type FormatLiteralType = {
  type: 'Literal'
  value: Literals
}

export type FormatRecordType = {
  type: 'Record'
  valueTypeId: number
  $ref: string
}

export type FormatListType = {
  type: 'List'
  itemTypeId: number
  $ref: string
}

export type FormatNullableType = {
  type: 'Nullable'
  itemTypeId: number
  $ref: string
}

export type FormatUnionType = {
  type: 'Union'
  itemTypes: { typeId: number; $ref: string }[]
}

export type FormatIntersectType = {
  type: 'Intersect'
  itemTypes: { typeId: number; $ref: string }[]
}

export type FormatType =
  | FormatObjectType
  | FormatUnionType
  | FormatStringType
  | FormatStructType
  | FormatUnknownType
  | FormatAnyType
  | FormatBooleanType
  | FormatFloatType
  | FormatIDType
  | FormatRecordType
  | FormatListType
  | FormatLiteralType
  | FormatNullableType
  | FormatIntType
  | FormatJsonType
  | FormatNumberType
  | FormatIntersectType

export type FormatTypes = {
  [key: string]: FormatType
}

export type FormaterContext = {
  addType: (type: FormatType) => number
  writerCache: WeakMap<Schema.SchemaCtor, FormaterWriter>
}

export type FormaterWriter = () => number

export type FormaterRule<S extends Schema.Schema, Context extends FormaterContext = FormaterContext> = TransformRule<
  S,
  FormaterWriter,
  Context
>

export const createFormater = <S extends Schema.SchemaCtor, Context extends FormaterContext = FormaterContext>(
  SchemaCtor: S,
  context: TransformContext<Context, FormaterWriter>,
): FormaterWriter => {
  if (context.writerCache.has(SchemaCtor)) {
    return context.writerCache.get(SchemaCtor)!
  }

  let transformer = createTransformer(context)
  let typeId: number | undefined

  let writer = () => {
    if (typeof typeId === 'number') {
      return typeId
    }
    let writer = transformer(SchemaCtor)
    return (typeId = writer())
  }

  context.writerCache.set(SchemaCtor, writer)

  return writer
}

export const formatSchema = <S extends Schema.SchemaCtor, Context extends FormaterContext = FormaterContext>(
  SchemaCtor: S,
  context?: TransformContext<Partial<Context>, FormaterWriter>,
) => {
  let types: FormatTypes = {}
  let uid = 0

  let lazyTypeList = [] as (FormatStructType | FormatObjectType)[]

  let addType = (type: FormatType): number => {
    if (type.type === 'Object' || type.type === 'Struct') {
      lazyTypeList.push(type)
    }

    if (context?.addType) {
      return context.addType(type)
    }

    let id = uid++
    types[`${id}`] = type
    return id
  }

  let finalContext = {
    writerCache: new WeakMap(),
    ...context,
    addType,
  } as TransformContext<Context, FormaterWriter>

  let format = createFormater(SchemaCtor, {
    ...finalContext,
    rules: {
      ...defaultFormaterRules,
      ...finalContext?.rules,
    },
  })

  let typeId = format()

  // trigger all lazy fields to expand formatResult.types
  while (lazyTypeList.length) {
    let objectType = lazyTypeList.shift()
    objectType?.fields
  }

  return {
    typeId,
    types,
  }
}

const StrictFormaterRule: FormaterRule<Schema.StrictType> = {
  test: (schema) => {
    return schema instanceof Schema.StrictType
  },
  transform: (schema, context) => {
    return createFormater(schema.Item, context)
  },
}

const NonStrictFormaterRule: FormaterRule<Schema.NonStrictType> = {
  test: (schema) => {
    return schema instanceof Schema.NonStrictType
  },
  transform: (schema, context) => {
    return createFormater(schema.Item, context)
  },
}

const ReadOnlyFormaterRule: FormaterRule<Schema.ReadOnlyType> = {
  test: (schema) => {
    return schema instanceof Schema.ReadOnlyType
  },
  transform: (schema, context) => {
    return createFormater(schema.Item, context)
  },
}

const ReadOnlyDeepFormaterRule: FormaterRule<Schema.ReadOnlyDeepType> = {
  test: (schema) => {
    return schema instanceof Schema.ReadOnlyDeepType
  },
  transform: (schema, context) => {
    return createFormater(schema.Item, context)
  },
}

const StringFormaterRule: FormaterRule<Schema.String> = {
  test: (schema) => {
    return schema instanceof Schema.String
  },
  transform: (_, context) => {
    return () => {
      return context.addType({
        type: 'String',
      })
    }
  },
}

const IntFormaterRule: FormaterRule<Schema.Int> = {
  test: (schema) => {
    return schema instanceof Schema.Int
  },
  transform: (_, context) => {
    return () => {
      return context.addType({
        type: 'Int',
      })
    }
  },
}

const FloatFormaterRule: FormaterRule<Schema.Float> = {
  test: (schema) => {
    return schema instanceof Schema.Float
  },
  transform: (_, context) => {
    return () => {
      return context.addType({
        type: 'Float',
      })
    }
  },
}

const NumberFormaterRule: FormaterRule<Schema.Number> = {
  test: (schema) => {
    return schema instanceof Schema.Number
  },
  transform: (_, context) => {
    return () => {
      return context.addType({
        type: 'Number',
      })
    }
  },
}

const IDFormaterRule: FormaterRule<Schema.ID> = {
  test: (schema) => {
    return schema instanceof Schema.ID
  },
  transform: (_, context) => {
    return () => {
      return context.addType({
        type: 'ID',
      })
    }
  },
}

const BooleanFormaterRule: FormaterRule<Schema.Boolean> = {
  test: (schema) => {
    return schema instanceof Schema.Boolean
  },
  transform: (_, context) => {
    return () => {
      return context.addType({
        type: 'Boolean',
      })
    }
  },
}

const LiteralFormaterRule: FormaterRule<Schema.LiteralType> = {
  test: (schema) => {
    return schema instanceof Schema.LiteralType
  },
  transform: (schema, context) => {
    return () => {
      return context.addType({
        type: 'Literal',
        value: schema.value,
      })
    }
  },
}

const ListFormaterRule: FormaterRule<Schema.ListType> = {
  test: (schema) => {
    return schema instanceof Schema.ListType
  },
  transform: (schema, context) => {
    let formatItem = createFormater(schema.Item, context)

    return () => {
      let typeId = formatItem()
      return context.addType({
        type: 'List',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    }
  },
}

type FieldsFormaters = {
  [key: string]: {
    writer: FormaterWriter
    SchemaCtor: Schema.SchemaCtor
    description?: string
    deprecated?: string
  }
}

const createFieldsFormaters = <T extends Schema.FieldDescriptors>(
  descriptors: T,
  context: TransformContext<any>,
): FieldsFormaters => {
  let fieldsFormaters = {} as FieldsFormaters

  for (let [key, field] of Object.entries(descriptors)) {
    if (!Schema.isFieldDescriptor(field)) {
      if (Schema.isFieldDescriptors(field)) {
        let SchemaCtor = Schema.Struct(field)
        fieldsFormaters[key] = {
          writer: createFormater(SchemaCtor, context),
          SchemaCtor,
        }
      }
      continue
    }

    if (typeof field === 'function') {
      fieldsFormaters[key] = {
        writer: createFormater(field, context),
        SchemaCtor: field,
      }
    } else {
      fieldsFormaters[key] = {
        writer: createFormater(field[Schema.Type], context),
        SchemaCtor: field[Schema.Type],
        description: field.description,
        deprecated: field.deprecated,
      }
    }
  }

  return fieldsFormaters
}

const ObjectFormaterRule: FormaterRule<Schema.ObjectType | Schema.StructType> = {
  test: (schema) => {
    return schema instanceof Schema.ObjectType || schema instanceof Schema.StructType
  },
  transform: (schema, context) => {
    let descriptors = (schema instanceof Schema.StructType ? schema.descriptors : schema) as Schema.FieldDescriptors
    let fieldsFormaters = createFieldsFormaters(descriptors, context)
    let fields = {} as FormatFields
    let hasGet = false
    let getFields = () => {
      if (hasGet) return fields
      hasGet = true
      for (let key in fieldsFormaters) {
        let fieldFormater = fieldsFormaters[key]
        let typeId = fieldFormater.writer()
        fields[key] = {
          typeId,
          $ref: `#/types/${typeId}`,
          description: fieldFormater.description,
          deprecated: fieldFormater.deprecated,
        }
      }
      return fields
    }
    let isStruct = schema.constructor.name === 'Struct'

    return () => {
      if (isStruct) {
        return context.addType({
          type: 'Struct',
          get fields() {
            return getFields()
          },
        })
      }

      return context.addType({
        type: 'Object',
        name: schema.constructor.name,
        get fields() {
          return getFields()
        },
      })
    }
  },
}

const RecordFormaterRule: FormaterRule<Schema.RecordType> = {
  test: (schema) => {
    return schema instanceof Schema.RecordType
  },
  transform: (schema, context) => {
    let formatItem = createFormater(schema.Item, context)

    return () => {
      let typeId = formatItem()
      return context.addType({
        type: 'Record',
        valueTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    }
  },
}

const NullableFormaterRule: FormaterRule<Schema.NullableType> = {
  test: (schema) => {
    return schema instanceof Schema.NullableType
  },
  transform: (schema, context) => {
    let formatItem = createFormater(schema.Item, context)

    return () => {
      let typeId = formatItem()
      return context.addType({
        type: 'Nullable',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    }
  },
}

const UnionFormaterRule: FormaterRule<Schema.UnionType> = {
  test: (schema) => {
    return schema instanceof Schema.UnionType
  },
  transform: (schema, context) => {
    let itemsFormaters = (schema.Items as Schema.SchemaCtor[]).map((Item) => createFormater(Item, context))

    return () => {
      return context.addType({
        type: 'Union',
        itemTypes: itemsFormaters.map((format) => {
          let typeId = format()
          return {
            typeId,
            $ref: `#/types/${typeId}`,
          }
        }),
      })
    }
  },
}

const IntersectFormaterRule: FormaterRule<Schema.IntersectType> = {
  test: (schema) => {
    return schema instanceof Schema.IntersectType
  },
  transform: (schema, context) => {
    let itemsFormaters = schema.Items.map((Item) => createFormater(Item, context))

    return () => {
      return context.addType({
        type: 'Intersect',
        itemTypes: itemsFormaters.map((format) => {
          let typeId = format()
          return {
            typeId,
            $ref: `#/types/${typeId}`,
          }
        }),
      })
    }
  },
}

const JsonFormaterRule: FormaterRule<Schema.Json> = {
  test: (schema) => {
    return schema instanceof Schema.Json
  },
  transform: (_schema, context) => {
    return () => {
      return context.addType({
        type: 'Json',
      })
    }
  },
}

const AnyFormaterRule: FormaterRule<Schema.Any> = {
  test: (schema) => {
    return schema instanceof Schema.Any
  },
  transform: (_schema, context) => {
    return () => {
      return context.addType({
        type: 'Any',
      })
    }
  },
}

const UnknownFormaterRule: FormaterRule<Schema.Unknown> = {
  test: (schema) => {
    return schema instanceof Schema.Unknown
  },
  transform: (_schema, context) => {
    return () => {
      return context.addType({
        type: 'Unknown',
      })
    }
  },
}

export const defaultFormaterRules = {
  String: StringFormaterRule,
  Boolean: BooleanFormaterRule,
  Number: NumberFormaterRule,
  Int: IntFormaterRule,
  Float: FloatFormaterRule,
  ID: IDFormaterRule,
  List: ListFormaterRule,
  Object: ObjectFormaterRule,
  Union: UnionFormaterRule,
  Intersect: IntersectFormaterRule,
  Nullable: NullableFormaterRule,
  Json: JsonFormaterRule,
  Any: AnyFormaterRule,
  Literal: LiteralFormaterRule,
  Record: RecordFormaterRule,
  Strict: StrictFormaterRule,
  NonStrict: NonStrictFormaterRule,
  ReadOnly: ReadOnlyFormaterRule,
  ReadOnlyDeep: ReadOnlyDeepFormaterRule,
  Unknown: UnknownFormaterRule,
}

export type DefaultFormaterRules = typeof defaultFormaterRules
