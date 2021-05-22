import * as S from './schema'
import { SchemaCtor, Schema, SchemaTypeOf, getInstance, Literals } from './schema'
import { getSchemaCtorFields, PartialType } from './helper'

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
  name?: string
  fields: FormatFields
}

export type FormatScalarType = {
  type: 'Scalar'
  valueType: string
  valueName: string
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
  name?: string
  itemTypes: { typeId: number; $ref: string }[]
}

export type FormatIntersectType = {
  type: 'Intersect'
  name?: string
  itemTypes: { typeId: number; $ref: string }[]
}

export type FormatTupleType = {
  type: 'Tuple'
  name?: string
  itemTypes: { typeId: number; $ref: string }[]
}

export type FormatStrictType = {
  type: 'Strict'
  itemTypeId: number
  $ref: string
}

export type FormatNonStrictType = {
  type: 'NonStrict'
  itemTypeId: number
  $ref: string
}

export type FormatReadOnlyType = {
  type: 'ReadOnly'
  itemTypeId: number
  $ref: string
}

export type FormatReadonlyDeepType = {
  type: 'ReadOnlyDeep'
  itemTypeId: number
  $ref: string
}

export type FormatType =
  | FormatScalarType
  | FormatObjectType
  | FormatUnionType
  | FormatStructType
  | FormatRecordType
  | FormatListType
  | FormatLiteralType
  | FormatNullableType
  | FormatIntersectType
  | FormatTupleType
  | FormatStrictType
  | FormatNonStrictType
  | FormatReadOnlyType
  | FormatReadonlyDeepType

export type FormatTypes = {
  [key: string]: FormatType
}

export type FormatContext = {
  addType: (type: FormatType) => number
  formatCache: WeakMap<Function, number>
}

export type FormatterMethods = {
  format(context: FormatContext): number
}

export type FormatterImpl<T extends Schema = Schema> = FormatterMethods | ((schema: T) => FormatterMethods)

export type NamedFormatType = 
  | FormatTupleType
  | FormatStructType
  | FormatUnionType
  | FormatIntersectType
  | FormatObjectType

export const isNamedFormatType = (input: FormatType): input is NamedFormatType => {
  return (
    input.type === 'Object' || 
    input.type === 'Struct' || 
    input.type === 'Union' ||
    input.type === 'Intersect' ||
    input.type === 'Tuple'
  )
}

const formatterWeakMap = new WeakMap<Function, FormatterImpl>()

const getFormatterImpl = (input: Function): FormatterImpl | undefined => {
  if (typeof input !== 'function') {
    return undefined
  }

  if (formatterWeakMap.has(input)) {
    return formatterWeakMap.get(input)
  }

  const next = Object.getPrototypeOf(input)

  if (next === Function.prototype) {
    return undefined
  }

  return getFormatterImpl(next)
}

export const Formatter = {
  impl<T extends Schema>(Ctor: abstract new () => T, impl: FormatterImpl<T>) {
    formatterWeakMap.set(Ctor, impl as FormatterImpl)
  },

  get<T extends SchemaCtor>(Ctor: T): FormatterMethods | undefined {
    const finalCtor = S.getSchemaCtor(Ctor)
    const FormatterImpl = getFormatterImpl(finalCtor as Function) as FormatterImpl<SchemaTypeOf<T>> | undefined

    // instantiation Formatter and save to weak-map
    if (typeof FormatterImpl === 'function') {
      const schema = getInstance(Ctor) as SchemaTypeOf<T>
      const impl = FormatterImpl(schema)

      formatterWeakMap.set(Ctor, impl)

      return impl
    }

    return FormatterImpl
  },

  formatSchema<T extends SchemaCtor>(Ctor: T, ctx: FormatContext): number {
    if (ctx.formatCache.has(Ctor)) {
      return ctx.formatCache.get(Ctor)!
    }

    const FormatterImpl = Formatter.get(Ctor)

    if (!FormatterImpl) {
      throw new Error(`No impl found for Formatter, Ctor: ${Ctor}`)
    }
    
    const typeId = FormatterImpl.format(ctx)

    ctx.formatCache.set(Ctor, typeId)

    return typeId
  },

  format<T extends SchemaCtor>(Ctor: T, context?: FormatContext) {
    const types: FormatTypes = {}
    let uid = 0

    const lazyTypeList = [] as (FormatStructType | FormatObjectType)[]

    const addType = (type: FormatType): number => {
      if (type.type === 'Object' || type.type === 'Struct') {
        lazyTypeList.push(type)
      }

      if (context?.addType) {
        return context.addType(type)
      }

      const id = uid++
      types[`${id}`] = type
      return id
    }

    const finalContext: FormatContext = {
      formatCache: new WeakMap(),
      ...context,
      addType,
    }

    const typeId = Formatter.formatSchema(Ctor, finalContext)

    // trigger all lazy fields to expand formatResult.types
    while (lazyTypeList.length) {
      const objectType = lazyTypeList.shift()
      objectType?.fields
    }

    return {
      typeId,
      types,
    }
  },
}

export const formatSchema = Formatter.format

Formatter.impl(S.String, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'string',
      valueName: 'String',
    })
  },
})

Formatter.impl(S.ID, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'string',
      valueName: 'ID',
    })
  },
})

Formatter.impl(S.Number, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'number',
      valueName: 'Number',
    })
  },
})

Formatter.impl(S.Int, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'number',
      valueName: 'Int',
    })
  },
})

Formatter.impl(S.Float, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'number',
      valueName: 'Float',
    })
  },
})

Formatter.impl(S.Boolean, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'boolean',
      valueName: 'Boolean',
    })
  },
})

Formatter.impl(S.Date, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'string',
      valueName: 'Date',
    })
  },
})

Formatter.impl(S.LiteralType, (schema) => {
  return {
    format(ctx) {
      return ctx.addType({
        type: 'Literal',
        value: schema.value,
      })
    },
  }
})

Formatter.impl(S.NullableType, (schema) => {
  return {
    format(ctx) {
      const typeId = Formatter.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'Nullable',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formatter.impl(S.ListType, (schema) => {
  return {
    format(ctx) {
      const typeId = Formatter.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'List',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formatter.impl(S.StructType, (schema) => {
  const fields = getSchemaCtorFields(schema.descriptors)
  return {
    format(ctx) {
      const formatFields: FormatFields = {}
      let hasGetFields = false
      const getFields = () => {
        if (hasGetFields) return formatFields
        hasGetFields = true

        for (const [key, Field] of Object.entries(fields)) {
          const typeId = Formatter.formatSchema(Field[S.Type], ctx)
          formatFields[key] = {
            typeId,
            $ref: `#/types/${typeId}`,
            description: Field.description,
            deprecated: Field.deprecated,
          }
        }
        
        return formatFields
      }
      const Constructor = schema.constructor as typeof S.Schema

      return ctx.addType({
        type: 'Struct',
        name: Constructor.displayName,
        get fields() {
          return getFields()
        }
      })
    },
  }
})

Formatter.impl(S.ObjectType, (schema) => {
  const fields = getSchemaCtorFields(schema as unknown as S.FieldDescriptors)
  return {
    format(ctx) {
      const formatFields: FormatFields = {}
      let hasGetFields = false
      const getFields = () => {
        if (hasGetFields) return formatFields
        hasGetFields = true

        for (const [key, Field] of Object.entries(fields)) {
          const typeId = Formatter.formatSchema(Field[S.Type], ctx)
          formatFields[key] = {
            typeId,
            $ref: `#/types/${typeId}`,
            description: Field.description,
            deprecated: Field.deprecated,
          }
        }
        
        return formatFields
      }
      const Constructor = schema.constructor as typeof S.Schema

      return ctx.addType({
        type: 'Object',
        name: Constructor.displayName ?? Constructor.name,
        get fields() {
          return getFields()
        }
      })
    },
  }
})

Formatter.impl(S.UnionType, (schema) => {
  const Constructor = schema.constructor as typeof S.Schema
  const displayName = Constructor.displayName
  return {
    format(ctx) {
      const itemTypes = schema.Items.map((Item) => {
        const typeId = Formatter.formatSchema(Item, ctx)
        return {
          typeId,
          $ref: `#/types/${typeId}`,
        }
      })
      return ctx.addType({
        type: 'Union',
        name: displayName,
        itemTypes,
      })
    },
  }
})

Formatter.impl(S.IntersectType, (schema) => {
  const Constructor = schema.constructor as typeof S.Schema
  const displayName = Constructor.displayName
  return {
    format(ctx) {
      const itemTypes = schema.Items.map((Item) => {
        const typeId = Formatter.formatSchema(Item, ctx)
        return {
          typeId,
          $ref: `#/types/${typeId}`,
        }
      })
      return ctx.addType({
        type: 'Intersect',
        name: displayName,
        itemTypes,
      })
    },
  }
})

Formatter.impl(S.TupleType, (schema) => {
  const Constructor = schema.constructor as typeof S.Schema
  const displayName = Constructor.displayName
  return {
    format(ctx) {
      const itemTypes = schema.Items.map((Item) => {
        const typeId = Formatter.formatSchema(Item, ctx)
        return {
          typeId,
          $ref: `#/types/${typeId}`,
        }
      })
      return ctx.addType({
        type: 'Tuple',
        name: displayName,
        itemTypes,
      })
    },
  }
})

Formatter.impl(S.RecordType, (schema) => {
  return {
    format(ctx) {
      const typeId = Formatter.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'Record',
        valueTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formatter.impl(S.Unknown, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'unknown',
      valueName: 'Unknown',
    })
  },
})

Formatter.impl(S.Any, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'any',
      valueName: 'Any',
    })
  },
})

Formatter.impl(S.Json, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'JsonType',
      valueName: 'Json',
    })
  },
})

Formatter.impl(S.StrictType, (schema) => {
  return {
    format(ctx) {
      const typeId = Formatter.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'Strict',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formatter.impl(S.NonStrictType, (schema) => {
  return {
    format(ctx) {
      const typeId = Formatter.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'NonStrict',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formatter.impl(S.ReadOnlyType, (schema) => {
  return {
    format(ctx) {
      const typeId = Formatter.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'ReadOnly',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formatter.impl(S.ReadOnlyDeepType, (schema) => {
  return {
    format(ctx) {
      const typeId = Formatter.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'ReadOnlyDeep',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formatter.impl(PartialType, schema => {
  const Constructor = schema.constructor as typeof S.Schema
  const ItemConstructor = schema.Item as unknown as typeof S.Schema

  ItemConstructor.displayName = Constructor.displayName

  return {
    format(ctx) {
      return Formatter.formatSchema(schema.Item, ctx)
    }
  }
})