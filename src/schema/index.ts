const GlobalObject = Object

export type Number = {
  kind: 'Number'
}

// tslint:disable-next-line: variable-name
export const Number: Number = {
  kind: 'Number',
}

export type String = {
  kind: 'String'
}

// tslint:disable-next-line: variable-name
export const String: String = {
  kind: 'String',
}

export type Boolean = {
  kind: 'Boolean'
}

// tslint:disable-next-line: variable-name
export const Boolean: Boolean = {
  kind: 'Boolean',
}

export type Nullable<T extends Data = any> = {
  kind: 'Nullable'
  type: T
}

export const Nullable = <T extends Data>(type: T): Nullable<T> => {
  return {
    kind: 'Nullable',
    type,
  }
}

type KindableData = String | Number | Boolean | List | Union

type LiteralData = string | number | boolean

type Data = KindableData | LiteralData | Object

export type MaybeNullable = Data | Nullable

export type List<T extends Data = any> = {
  kind: 'List'
  type: T
}

export const List = <T extends Data>(type: T): List<T> => {
  return {
    kind: 'List',
    type,
  }
}

export type Object = {
  [key: string]: MaybeNullable
}

export type Union<T extends MaybeNullable[] = any> = {
  kind: 'Union'
  types: T
}

export const Union = <T extends MaybeNullable[]>(...types: T): Union<T> => {
  return {
    kind: 'Union',
    types,
  }
}

export type Optional<T> = T | null | undefined

type RawListType<T extends List> = T extends List<infer Item> ? Array<RawType<Item>> : never

type RawUnionItemType<T> = T extends any ? RawType<T> : never

type RawUnionType<T extends Union> = T extends Union<infer Types>
  ? RawUnionItemType<Types[number]>
  : never

export type RawType<T> = T extends Number
  ? number
  : T extends String
  ? string
  : T extends Boolean
  ? boolean
  : T extends List
  ? RawListType<T>
  : T extends Object
  ? {
      [key in keyof T]: T[key] extends Nullable<infer V> ? Optional<RawType<V>> : RawType<T[key]>
    }
  : T extends Union
  ? RawUnionType<T>
  : T

export type ValidationError = {
  kind: 'Err'
  schema: MaybeNullable
  path: string[]
  input: any
  message: string
}

export type ValidationValue<T extends MaybeNullable> = {
  kind: 'Ok'
  value: RawType<T>
}

export type ValidationResult<T extends MaybeNullable> = ValidationError | ValidationValue<T>

const isObject = (input: any): input is object => {
  return !!(input && GlobalObject.prototype.toString.call(input) === '[object Object]')
}

const isLiteralType = (input: any): input is LiteralData => {
  return typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean'
}

const isObjectType = (input: any): input is Object => {
  return !!(isObject(input) && !('kind' in input))
}

const isKindableType = (input: any): input is KindableData => {
  return /String|Number|Boolean|List|Union/.test(input?.kind)
}

const isNullableType = (input: any): input is Nullable => {
  return input?.kind === 'Nullable'
}

export const verify = <T extends MaybeNullable>(
  schema: T,
  input: any,
  path = [] as string[]
): ValidationResult<T> => {
  if (isLiteralType(schema)) {
    if (schema === input) {
      return {
        kind: 'Ok',
        value: input,
      }
    } else {
      return {
        kind: 'Err',
        schema,
        path,
        input,
        message: `Literal Schema: ${input} is not equal to ${schema}`,
      }
    }
  }

  if (isObjectType(schema)) {
    if (!isObject(input)) {
      return {
        kind: 'Err',
        schema,
        path,
        input,
        message: `Object Schema: ${input} is not an object with { ${Object.keys(schema)} }`,
      }
    }

    let object = {} as RawType<T>

    for (let fieldName in schema) {
      let fieldSchema = schema[fieldName as keyof T]

      let result = verify(fieldSchema, (input as any)[fieldName], [...path, fieldName])

      if (result.kind === 'Err') {
        return result
      }

      ;(object as any)[fieldName] = result.value
    }

    return {
      kind: 'Ok',
      value: object,
    }
  }

  if (isKindableType(schema)) {
    if (schema.kind === 'Boolean') {
      // parse boolean from string
      if (typeof input === 'string') {
        if (input === 'false') {
          input = false
        } else if (input === 'true') {
          input = true
        }
      }

      if (typeof input === 'boolean') {
        return {
          kind: 'Ok',
          value: input as RawType<T>,
        }
      } else {
        return {
          kind: 'Err',
          schema,
          path,
          input,
          message: `Boolean Schema: ${input} is not Boolean`,
        }
      }
    }

    if (schema.kind === 'Number') {
      // parsr number from string
      if (typeof input === 'string') {
        let num = parseFloat(input)
        if (!isNaN(num)) {
          input = num
        }
      }

      if (typeof input === 'number') {
        return {
          kind: 'Ok',
          value: input as RawType<T>,
        }
      } else {
        return {
          kind: 'Err',
          schema,
          path,
          input,
          message: `Number Schema: ${input} is not Number`,
        }
      }
    }

    if (schema.kind === 'String') {
      if (typeof input === 'string') {
        return {
          kind: 'Ok',
          value: input as RawType<T>,
        }
      } else {
        return {
          kind: 'Err',
          schema,
          path,
          input,
          message: `String Schema: ${input} is not String`,
        }
      }
    }

    if (schema.kind === 'List') {
      if (!Array.isArray(input)) {
        return {
          kind: 'Err',
          schema,
          path,
          input,
          message: `List Schema: ${input} is not List`,
        }
      }

      let list = []

      for (let i = 0; i < input.length; i++) {
        let result = verify(schema.type, input[i], [...path, i.toString()])

        if (result.kind === 'Err') {
          return result
        }

        list.push(result.value)
      }

      return {
        kind: 'Ok',
        value: list as RawType<T>,
      }
    }

    if (schema.kind === 'Union') {
      for (let i = 0; i < schema.types.length; i++) {
        let result = verify(schema.types[i], input, path)

        if (result.kind === 'Ok') {
          return result
        }
      }

      return {
        kind: 'Err',
        schema,
        path,
        input,
        message: `Union Schema: ${input} is not one of union types: ${JSON.stringify(
          schema.types
        )}`,
      }
    }
  }

  if (isNullableType(schema)) {
    if (input == null) {
      return {
        kind: 'Ok',
        value: input,
      }
    }

    return verify(schema.type, input, path)
  }

  throw new Error(`Unknown schema: ${schema}`)
}

// const Todo = {
//   id: Number,
//   content: String,
//   completed: Boolean,
// }

// const TodoApp = {
//   header: {
//     text: String,
//   },
//   todos: List(Todo),
//   footer: {
//     filterType: Union('all', 'active', 'completed'),
//   },
//   a: Nullable(List(Todo)),
//   d: Union(false, 1),
// }

// type TodoAppType = RawType<typeof TodoApp>

// const todoState: TodoAppType = {
//   header: {
//     text: '123',
//   },
//   todos: [],
//   footer: {
//     filterType: 'all',
//   },
//   a: null,
//   d: false,
// }

// const result = verify(TodoApp, {
//   header: {
//     text: 'adf',
//   },
//   todos: [{ id: 0, content: '1', completed: 'false' }],
//   footer: {
//     filterType: 'completed',
//   },
//   d: 1,
//   f: 32,
//   e: 4,
// })

// console.log('result', result)
