import * as Schema from './index'

type LiteNullable = {
  __kind: 'nullable'
  type: LiteSchema
}

type LiteUnion = {
  __kind: 'union'
  types: LiteSchema[]
}

type LiteObject = {
  [key: string]: LiteSchema
}

type LiteList = [LiteSchema]

type LiteTuple = LiteSchema[]

export type LiteSchema =
  | NumberConstructor
  | StringConstructor
  | BooleanConstructor
  | LiteList
  | LiteNullable
  | LiteUnion
  | LiteObject
  | LiteTuple
  | number
  | string
  | boolean
  | null

type RawLiteUnion<T extends LiteUnion> = T extends LiteUnion
  ? RawLiteSchema<T['types'][number]>
  : never

export type RawLiteSchema<T> = T extends NumberConstructor
  ? number
  : T extends StringConstructor
  ? string
  : T extends BooleanConstructor
  ? boolean
  : T extends LiteList
  ? RawLiteSchema<T[0]>[]
  : T extends LiteNullable
  ? RawLiteSchema<T['type']> | null | undefined
  : T extends LiteUnion
  ? RawLiteUnion<T>
  : T extends LiteObject | LiteTuple
  ? {
      [key in keyof T]: RawLiteSchema<T[key]>
    }
  : T extends string | number | boolean | null
  ? T
  : never

type T1 = RawLiteUnion<{
  __kind: 'union'
  types: [StringConstructor, BooleanConstructor]
}>

type T2 = RawLiteSchema<{
  __kind: 'union'
  types: [StringConstructor, BooleanConstructor]
}>

type T3 = [T1, T2]

type T4 = RawLiteSchema<null>

const isLiteNullable = (input: any): input is LiteNullable => {
  return !!(input && input.__kind === 'nullable')
}

const isLiteUnion = (input: any): input is LiteUnion => {
  return !!(input && input.__kind === 'union')
}

const isNull = (input: any): input is null => {
  return input === null
}

const isNumberConstructor = (input: any): input is NumberConstructor => {
  return input === Number
}

const isStringConstructor = (input: any): input is StringConstructor => {
  return input === String
}

const isBooleanConstructor = (input: any): input is BooleanConstructor => {
  return input === Boolean
}

const isLiteList = (input: any): input is LiteList => {
  return Array.isArray(input) && input.length === 1
}

const isLiteTuple = (input: any): input is LiteTuple => {
  return Array.isArray(input) && input.length !== 1
}

const isLiteObject = (input: any): input is LiteObject => {
  return !!(input && !Array.isArray(input) && typeof input === 'object')
}

const isNumber = (input: any): input is number => {
  return typeof input === 'number'
}

const isString = (input: any): input is string => {
  return typeof input === 'string'
}

const isBoolean = (input: any): input is boolean => {
  return typeof input === 'boolean'
}

type FromLiteSchema<T extends LiteSchema> = Schema.Type<RawLiteSchema<T>>


export function fromLiteSchema<T extends LiteSchema>(schema: T): RawLiteSchema<T> {
  if (isStringConstructor(schema)) {
    return 'Schema.string'
  }

  if (isNull(schema)) {
    let value: null = schema

    return Schema.literal(value)
  }


  if (schema === Number) {
    return (Schema.number as unknown) as Result
  }

  if (schema === Boolean) {
    return (Schema.boolean as unknown) as Result
  }

  if (isLiteNullable(schema)) {
    let Type = fromLiteSchema(schema.type)
    return Schema.nullable(Type)
  }

  if (isLiteUnion(schema)) {
    let types = schema.types.map(fromLiteSchema)
    return Schema.union(...types)
  }

  if (Array.isArray(schema)) {
    let itemType = fromLiteSchema(schema[0])
    return (Schema.list(itemType) as unknown) as Result
  }

  if (typeof schema === 'object') {
    let fields = {} as any

    for (let key in schema) {
      let field = schema[key]
      fields[key] = fromLiteSchema(field)
    }

    return (Schema.object(fields) as unknown) as Result
  }

  if (typeof schema === 'string' || typeof schema === 'number' || typeof schema === 'boolean') {
    let value: string | boolean | number = schema
    return (Schema.literal(value) as unknown) as Result
  }

  throw new Error(`Unknown schema: ${schema}`)
}

let t1 = fromLiteSchema({
  union: true,
  types: [String, Boolean],
})

let t0 = fromLiteSchema({
  k: {
    nullable: true,
    type: '123' as const,
  },
  l: {
    union: true,
    types: [String, Boolean],
  },
  h: {
    __kind: 'union',
    types: [String, Boolean],
  },
  a: String,
  b: Boolean,
  c: [Number],
  d: {
    f: null,
    g: 1 as const,
    h: '1',
    i: false,
  },
})
