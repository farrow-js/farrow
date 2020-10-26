import { assign, entries, toNumber } from './util'
import { Json, Err, Ok, Result } from '../types'

export {
  Json,
  Err,
  Ok,
  Result
}

export type SchemaValidationError = {
  path?: (string | number)[]
  message: string
}

const TypeSymbol = Symbol('Type')

export type Type<T = any> = {
  (value: T): Term<T>
  [TypeSymbol]: true
  toJSON: () => Json
  is: (term: Term) => term is Term<T>
  assert: (term: Term) => asserts term is Term<T>
  validate: (input: unknown) => Result<T, SchemaValidationError>
}

export const isType = (input: any): input is Type => {
  return !!(input && input[TypeSymbol])
}

const TermSymbol = Symbol('Term')

export type Term<T = any> = {
  [TermSymbol]: symbol
  value: T
}

export const isTerm = (input: any): input is Term => {
  return !!(input && input[TermSymbol])
}

export type RawType<T extends Type> = T extends Type<infer R> ? R : T

export type CreateTypeOptions<T, I = unknown> = {
  toJSON?: () => Json
  validate: (input: I) => Result<T, SchemaValidationError>
}

export const createType = <T>(options: CreateTypeOptions<T>): Type<T> => {
  type Schema = Type<T>

  let symbol = Symbol('TypeKind')

  let validate: Schema['validate'] = options.validate

  let is = (input: Term): input is Term<T> => {
    return input[TermSymbol] === symbol
  }

  let assert: Schema['assert'] = (input) => {
    if (!is(input)) {
      throw new Error(`Unexpected value: ${input}`)
    }
  }

  let toJSON = options.toJSON ?? (() => ({
    type: 'Type'
  }))

  let json: Json | undefined
  let runing = false

  let props = {
    [TypeSymbol]: true as const,
    toJSON: () => {
      if (runing) {
        return {
          type: 'Recursive',
        }
      }

      runing = true

      if (json === undefined) {
        json = toJSON()
      }

      runing = false

      return json
    },
    validate,
    is,
    assert,
  }

  let schema: Schema = assign((value: T) => {
    let result = validate(value)
    if (result.isErr) throw new Error(result.value.message)
    return {
      [TermSymbol]: symbol,
      value: result.value,
    }
  }, props)

  return schema
}

export const thunk = <T>(f: () => Type<T>): Type<T> => {
  let Type: Type<T> | undefined

  let getType = () => {
    if (Type === undefined) {
      Type = f()
    }
    return Type
  }

  return createType({
    toJSON: () => {
      return getType().toJSON()
    },
    validate: (input) => {
      return getType().validate(input)
    },
  })
}

// tslint:disable-next-line: variable-name
export const number = createType<number>({
  toJSON: () => {
    return {
      type: 'Number',
    }
  },
  validate: (input) => {
    if (typeof input === 'string') {
      let n = toNumber(input)
      if (!isNaN(n)) {
        input = n
      }
    }
    if (typeof input === 'number') {
      return Ok(input)
    } else {
      return Err({
        message: `${input} is not a number`,
      })
    }
  },
})

// tslint:disable-next-line: variable-name
export const string = createType<string>({
  toJSON: () => {
    return {
      type: 'String',
    }
  },
  validate: (input) => {
    if (typeof input === 'string') {
      return Ok(input)
    } else {
      return Err({
        message: `${input} is not a string`,
      })
    }
  },
})

// tslint:disable-next-line: variable-name
export const boolean = createType<boolean>({
  toJSON: () => {
    return {
      type: 'Boolean',
    }
  },
  validate: (input) => {
    if (input === 'true') {
      input = true
    } else if (input === 'false') {
      input = false
    }
    if (typeof input === 'boolean') {
      return Ok(input)
    } else {
      return Err({
        message: `${input} is not a boolean`,
      })
    }
  },
})

export const list = <T extends Type>(ItemType: T): Type<Array<RawType<T>>> => {
  type list = Array<RawType<T>>
  return createType<list>({
    toJSON: () => {
      return {
        type: 'List',
        itemType: ItemType.toJSON(),
      }
    },
    validate: (input) => {
      if (!Array.isArray(input)) {
        return Err({
          message: `${input} is not a array`,
        })
      }

      let list: list = []

      for (let i = 0; i < input.length; i++) {
        let item = input[i]
        let result = ItemType.validate(item)
        if (result.isErr) {
          return Err({
            path: [i, ...(result.value.path ?? [])],
            message: result.value.message,
          })
        }
        list.push(result.value)
      }

      return Ok(list)
    },
  })
}

export type Fields = {
  [key: string]: Type
}

export type RawFields<T extends Fields> = {
  [key in keyof T as undefined extends RawType<T[key]> ? never : key ]: RawType<T[key]>
} & {
  [key in keyof T as undefined extends RawType<T[key]> ? key : never ]?: RawType<T[key]>
}

export const object = <T extends Fields>(
  fields: T
): Type<
  {
    [key in keyof RawFields<T>]: RawFields<T>[key]
  }
> => {
  type ObjectType = {
    [key in keyof RawFields<T>]: RawFields<T>[key]
  }

  let Type: Type<ObjectType> = createType({
    toJSON: () => {
      let list = entries(fields).map(([key, Type]) => {
        return {
          key,
          type: Type.toJSON(),
        }
      })
      return {
        type: 'Object',
        fields: list,
      }
    },
    validate: (input) => {
      if (typeof input !== 'object') {
        return Err({
          message: `${input} is not an object`,
        })
      }

      if (input === null) {
        return Err({
          message: `null is not an object`,
        })
      }

      if (Array.isArray(input)) {
        return Err({
          message: `${input} is not an object`,
        })
      }

      let object = {} as any

      let source = input as Record<string, any>

      for (let key in fields) {
        let FieldType = fields[key]
        let field = source[key]
        let result = FieldType.validate(field)

        if (result.isErr) {
          return Err({
            path: [key, ...(result.value.path ?? [])],
            message: result.value.message,
          })
        }

        object[key] = result.value
      }

      return Ok(object as ObjectType)
    },
  })

  return Type
}

export const nullable = <T extends Type>(Type: T): Type<RawType<T> | null | undefined> => {
  return createType<RawType<T> | null | undefined>({
    toJSON: () => {
      return {
        type: 'Nullable',
        contentType: Type.toJSON(),
      }
    },
    validate: (input) => {
      if (input === null) {
        return Ok(input)
      }

      if (input === undefined) {
        return Ok(input)
      }

      return Type.validate(input)
    },
  })
}

type RawUnionItemType<T extends Type> = T extends Type ? RawType<T> : never

export const union = <T extends Type[]>(...Types: T): Type<RawUnionItemType<T[number]>> => {
  let Type: Type<RawUnionItemType<T[number]>> = createType({
    toJSON: () => {
      return {
        type: 'Union',
        contentTypes: Types.map((Type) => Type.toJSON()),
      }
    },
    validate: (input) => {
      for (let i = 0; i < Types.length; i++) {
        let Type = Types[i]
        let result = Type.validate(input)
        if (result.isOk) return result
      }
      return Err({
        message: `${input} is not matched the union types: \n${JSON.stringify(
          Type.toJSON(),
          null,
          2
        )}`,
      })
    },
  })

  return Type
}

/** Augmentation support for UserDefinedOptions. Used specifically for adding custom string formats. */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

type ListToIntersectionType<T extends Type[]> = UnionToIntersection<
  {
    [key in keyof T]: T[key] extends Type<infer U> ? U : never
  }[number]
>

export const intersect = <T extends Type[]>(...Types: T): Type<ListToIntersectionType<T>> => {
  let Type: Type<ListToIntersectionType<T>> = createType({
    toJSON: () => {
      return {
        type: 'Intersect',
        contentTypes: Types.map((Type) => Type.toJSON()),
      }
    },
    validate: (input) => {
      let values: T[number][] = []
      for (let i = 0; i < Types.length; i++) {
        let Type = Types[i]
        let result = Type.validate(input)

        if (result.isErr) {
          return Err({
            message: `${input} is not matched the union types: \n${JSON.stringify(
              Type.toJSON(),
              null,
              2
            )}`,
          })
        } else {
          values.push(result.value)
        }
      }

      let result = values.reduce((result, value) => Object.assign(result, value))

      return Ok(result as ListToIntersectionType<T>) 
    },
  })

  return Type as any
}

export type LiteralType = string | number | boolean | null | undefined

export const literal = <T extends LiteralType>(literal: T): Type<T> => {
  return createType<T>({
    toJSON: () => {
      return {
        type: 'Literal',
        literal: literal as any,
      }
    },
    validate: (input) => {
      if (input === literal) {
        return Ok(literal)
      } else {
        return Err({
          message: `${input} is not equal to ${literal}`,
        })
      }
    },
  })
}

export const record = <T extends Type>(Type: T): Type<Record<string, RawType<T>>> => {
  let ResultType: Type<Record<string, RawType<T>>> = createType({
    toJSON: () => {
      return {
        type: 'Record',
        valueType: Type.toJSON(),
      }
    },
    validate: (input) => {
      if (typeof input !== 'object') {
        return Err({
          message: `${input} is not an object`,
        })
      }

      if (input === null) {
        return Err({
          message: `null is not an object`,
        })
      }

      if (Array.isArray(input)) {
        return Err({
          message: `${input} is not an object`,
        })
      }

      let record = {} as Record<string, RawType<T>>

      let source = input as any

      for (let key in source) {
        let value = source[key]
        let result = Type.validate(value)
        if (result.isErr) {
          return Err({
            path: [key, ...(result.value.path ?? [])],
            message: result.value.message,
          })
        }
        record[key] = result.value
      }

      return Ok(record)
    },
  })

  return ResultType
}

export type ObjectSchema = Type<Record<string, any>>

export type ListSchema = Type<any[]>

export type JsonSchema = Type<Json>

export const json: JsonSchema = thunk(() => {
  return union(number, string, boolean, any, literal(null), list(json), record(json))
})

// tslint:disable-next-line: variable-name
export const any = createType<any>({
  toJSON: () => {
    return {
      type: 'Any',
    }
  },
  validate: (input) => {
    return Ok(input as any)
  },
})

export type TermSchema = Type<Term>

export const term: TermSchema = createType({
  toJSON: () => {
    return {
      type: 'Term',
    }
  },
  validate: (input) => {
    if (isTerm(input)) {
      return Ok(input)
    } else {
      return Err({
        message: `${input} is not a term of any Type`,
      })
    }
  },
})