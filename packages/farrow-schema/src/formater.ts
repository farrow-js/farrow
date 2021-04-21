import * as S from './schema'
import { SchemaCtor, Schema, SchemaTypeOf, getInstance, Literals } from './schema'
import { getSchemaCtorFields } from './helper'

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

export type FormaterMethods = {
  format(context: FormatContext): number
}

export type FormaterImpl<T extends Schema = Schema> = FormaterMethods | ((schema: T) => FormaterMethods)

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

const formaterWeakMap = new WeakMap<Function, FormaterImpl>()

const getFormaterImpl = (input: Function): FormaterImpl | undefined => {
  if (typeof input !== 'function') {
    return undefined
  }

  if (formaterWeakMap.has(input)) {
    return formaterWeakMap.get(input)
  }

  let next = Object.getPrototypeOf(input)

  if (next === Function.prototype) {
    return undefined
  }

  return getFormaterImpl(next)
}

export const Formater = {
  impl<T extends Schema>(Ctor: abstract new () => T, impl: FormaterImpl<T>) {
    formaterWeakMap.set(Ctor, impl as FormaterImpl)
  },

  get<T extends SchemaCtor>(Ctor: T): FormaterMethods | undefined {
    let finalCtor = S.getSchemaCtor(Ctor)
    let FormaterImpl = getFormaterImpl(finalCtor as Function) as FormaterImpl<SchemaTypeOf<T>> | undefined

    // instantiation Formater and save to weak-map
    if (typeof FormaterImpl === 'function') {
      let schema = getInstance(Ctor) as SchemaTypeOf<T>
      let impl = FormaterImpl(schema)

      formaterWeakMap.set(Ctor, impl)

      return impl
    }

    return FormaterImpl
  },

  formatSchema<T extends SchemaCtor>(Ctor: T, ctx: FormatContext): number {
    if (ctx.formatCache.has(Ctor)) {
      return ctx.formatCache.get(Ctor)!
    }

    let FormaterImpl = Formater.get(Ctor)

    if (!FormaterImpl) {
      throw new Error(`No impl found for Formater, Ctor: ${Ctor}`)
    }
    
    let typeId = FormaterImpl.format(ctx)

    ctx.formatCache.set(Ctor, typeId)

    return typeId
  },

  format<T extends SchemaCtor>(Ctor: T, context?: FormatContext) {
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

    let finalContext: FormatContext = {
      formatCache: new WeakMap(),
      ...context,
      addType,
    }

    let typeId = Formater.formatSchema(Ctor, finalContext)

    // trigger all lazy fields to expand formatResult.types
    while (lazyTypeList.length) {
      let objectType = lazyTypeList.shift()
      objectType?.fields
    }

    return {
      typeId,
      types,
    }
  },
}

export const formatSchema = Formater.format

Formater.impl(S.String, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'string',
      valueName: 'String',
    })
  },
})

Formater.impl(S.ID, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'string',
      valueName: 'ID',
    })
  },
})

Formater.impl(S.Number, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'number',
      valueName: 'Number',
    })
  },
})

Formater.impl(S.Int, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'number',
      valueName: 'Int',
    })
  },
})

Formater.impl(S.Float, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'number',
      valueName: 'Float',
    })
  },
})

Formater.impl(S.Boolean, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'boolean',
      valueName: 'Boolean',
    })
  },
})

Formater.impl(S.Date, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'string',
      valueName: 'Date',
    })
  },
})

Formater.impl(S.LiteralType, (schema) => {
  return {
    format(ctx) {
      return ctx.addType({
        type: 'Literal',
        value: schema.value,
      })
    },
  }
})

Formater.impl(S.NullableType, (schema) => {
  return {
    format(ctx) {
      let typeId = Formater.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'Nullable',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formater.impl(S.ListType, (schema) => {
  return {
    format(ctx) {
      let typeId = Formater.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'List',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formater.impl(S.StructType, (schema) => {
  let fields = getSchemaCtorFields(schema.descriptors)
  return {
    format(ctx) {
      let formatFields: FormatFields = {}
      let hasGetFields = false
      let getFields = () => {
        if (hasGetFields) return formatFields
        hasGetFields = true

        for (let [key, Field] of Object.entries(fields)) {
          let typeId = Formater.formatSchema(Field[S.Type], ctx)
          formatFields[key] = {
            typeId,
            $ref: `#/types/${typeId}`,
            description: Field.description,
            deprecated: Field.deprecated,
          }
        }
        
        return formatFields
      }
      let Constructor = schema.constructor as typeof S.Schema

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

Formater.impl(S.ObjectType, (schema) => {
  let fields = getSchemaCtorFields(schema as unknown as S.FieldDescriptors)
  return {
    format(ctx) {
      let formatFields: FormatFields = {}
      let hasGetFields = false
      let getFields = () => {
        if (hasGetFields) return formatFields
        hasGetFields = true

        for (let [key, Field] of Object.entries(fields)) {
          let typeId = Formater.formatSchema(Field[S.Type], ctx)
          formatFields[key] = {
            typeId,
            $ref: `#/types/${typeId}`,
            description: Field.description,
            deprecated: Field.deprecated,
          }
        }
        
        return formatFields
      }
      let Constructor = schema.constructor as typeof S.Schema

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

Formater.impl(S.UnionType, (schema) => {
  let Constructor = schema.constructor as typeof S.Schema
  let displayName = Constructor.displayName
  return {
    format(ctx) {
      let itemTypes = schema.Items.map((Item) => {
        let typeId = Formater.formatSchema(Item, ctx)
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

Formater.impl(S.IntersectType, (schema) => {
  let Constructor = schema.constructor as typeof S.Schema
  let displayName = Constructor.displayName
  return {
    format(ctx) {
      let itemTypes = schema.Items.map((Item) => {
        let typeId = Formater.formatSchema(Item, ctx)
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

Formater.impl(S.TupleType, (schema) => {
  let Constructor = schema.constructor as typeof S.Schema
  let displayName = Constructor.displayName
  return {
    format(ctx) {
      let itemTypes = schema.Items.map((Item) => {
        let typeId = Formater.formatSchema(Item, ctx)
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

Formater.impl(S.RecordType, (schema) => {
  return {
    format(ctx) {
      let typeId = Formater.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'Record',
        valueTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formater.impl(S.Unknown, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'unknown',
      valueName: 'Unknown',
    })
  },
})

Formater.impl(S.Any, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'any',
      valueName: 'Any',
    })
  },
})

Formater.impl(S.Json, {
  format(ctx) {
    return ctx.addType({
      type: 'Scalar',
      valueType: 'JsonType',
      valueName: 'Json',
    })
  },
})

Formater.impl(S.StrictType, (schema) => {
  return {
    format(ctx) {
      let typeId = Formater.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'Strict',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formater.impl(S.NonStrictType, (schema) => {
  return {
    format(ctx) {
      let typeId = Formater.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'NonStrict',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formater.impl(S.ReadOnlyType, (schema) => {
  return {
    format(ctx) {
      let typeId = Formater.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'ReadOnly',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})

Formater.impl(S.ReadOnlyDeepType, (schema) => {
  return {
    format(ctx) {
      let typeId = Formater.formatSchema(schema.Item, ctx)
      return ctx.addType({
        type: 'ReadOnlyDeep',
        itemTypeId: typeId,
        $ref: `#/types/${typeId}`,
      })
    },
  }
})
