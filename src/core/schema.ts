import { match as createMatch } from 'path-to-regexp'
import { assign, entries, toNumber } from './util'

type Json =
  | number
  | string
  | boolean
  | null
  | Json[]
  | {
      [key: string]: Json
    }

const TypeSymbol = Symbol('Type')

export type Type<T = any> = {
  (value: T): Term<T>
  [TypeSymbol]: true
  toJSON: () => Json
  is: (term: Term) => term is Term<T>
  assert: (term: Term) => asserts term is Term<T>
  validate: (input: unknown) => Result<T>
  create: <R>(options: CreateTypeOptions<R, T>) => Type<R>
  pipe: <R>(Type: Type<R>) => Type<R>
}

export const isType = <T = any>(input: any): input is Type<T> => {
  return !!(input && input[TypeSymbol])
}

export type Term<T = any> = {
  kind: symbol
  value: T
}

export type RawType<T extends Type> = T extends Type<infer R> ? R : T

export type Err<T = any> = {
  kind: 'Err'
  value: T
  isErr: true
  isOk: false
}

export type Ok<T = any> = {
  kind: 'Ok'
  value: T
  isErr: false
  isOk: true
}

export type Result<T = any, E = string> = Err<E> | Ok<T>

export const Err = <E = string>(value: E): Err<E> => {
  let err: Err = {
    kind: 'Err',
    value,
    isErr: true,
    isOk: false,
  }
  return err
}

export const Ok = <T, E = string>(value: T): Result<T, E> => {
  let ok: Ok<T> = {
    kind: 'Ok',
    value,
    isErr: false,
    isOk: true,
  }
  return ok
}

export type CreateTypeOptions<T, I = unknown> = {
  toJSON: () => Json
  validate: (input: I) => Result<T>
}

export const createType = <T>(options: CreateTypeOptions<T>): Type<T> => {
  type Schema = Type<T>

  let symbol = Symbol('KIND')

  let validate: Schema['validate'] = options.validate

  let is = (input: Term): input is Term<T> => {
    return input.kind === symbol
  }

  let assert: Schema['assert'] = (input) => {
    if (!is(input)) {
      throw new Error(`Unexpected value: ${input}`)
    }
  }

  let pipe: Schema['pipe'] = (NextType) => {
    return create({
      toJSON: () => {
        return {
          type: 'Pipe',
          prev: schema.toJSON(),
          next: NextType.toJSON(),
        }
      },
      validate: (input) => {
        let result = schema.validate(input)
        if (result.isErr) return result
        return NextType.validate(result.value)
      },
    })
  }

  let create: Schema['create'] = (options) => {
    return createType({
      toJSON: () => {
        return {
          type: 'Create',
          prev: schema.toJSON(),
          next: options.toJSON(),
        }
      },
      validate: (input) => {
        let result = validate(input)
        if (result.isErr) return result
        return options.validate(result.value)
      },
    })
  }

  let json: Json | undefined

  let props = {
    [TypeSymbol]: true as const,
    toJSON: () => {
      if (json === undefined) {
        json = options.toJSON()
      }
      return json
    },
    validate,
    is,
    assert,
    create,
    pipe,
    test,
  }

  let schema: Schema = assign((value: T) => {
    let result = validate(value)
    if (result.isErr) {
      throw new Error(result.value)
    }
    return {
      kind: symbol,
      value: result.value,
    }
  }, props)

  return schema
}

export const is = <T>(input: Term, Type: Type<T>): input is Term<T> => {
  return Type.is(input)
}

export const Thunk = <T>(f: () => Type<T>): Type<T> => {
  let Type: Type<T> | undefined

  let getType = () => {
    if (Type === undefined) {
      Type = f()
    }
    return Type
  }

  return createType<T>({
    toJSON: () => {
      return getType().toJSON()
    },
    validate: (input) => {
      return getType().validate(input)
    },
  })
}

// tslint:disable-next-line: variable-name
export const Number = createType<number>({
  toJSON: () => {
    return 'number'
  },
  validate: (input) => {
    if (input === 'string') {
      let n = toNumber(input)
      if (!isNaN(n)) {
        input = n
      }
    }
    if (typeof input === 'number') {
      return Ok(input)
    } else {
      return Err(`${input} is not a number`)
    }
  },
})

// tslint:disable-next-line: variable-name
export const String = createType<string>({
  toJSON: () => {
    return 'string'
  },
  validate: (input) => {
    if (typeof input === 'string') {
      return Ok(input)
    } else {
      return Err(`${input} is not a string`)
    }
  },
})

// tslint:disable-next-line: variable-name
export const Boolean = createType<boolean>({
  toJSON: () => {
    return 'boolean'
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
      return Err(`${input} is not a boolean`)
    }
  },
})

export const List = <T extends Type>(ItemType: T): Type<Array<RawType<T>>> => {
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
        return Err(`${input} is not a array`)
      }

      let list: list = []

      for (let i = 0; i < input.length; i++) {
        let item = input[i]
        let result = ItemType.validate(item)
        if (result.isErr) return result
        list.push(result.value)
      }

      return Ok(list)
    },
  })
}

export type Fields = {
  [key: string]: Type
}

type RawFields<T extends Fields> = {
  [key in keyof T]: RawType<T[key]>
}

export const Object = <T extends Fields>(
  fields: T
): Type<
  {
    [key in keyof T]: RawType<T[key]>
  }
> => {
  type ObjectType = RawFields<T>

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
        return Err(`${input} is not an object`)
      }

      if (input === null) {
        return Err(`null is not an object`)
      }

      if (Array.isArray(input)) {
        return Err(`${input} is not an object`)
      }

      let object = {} as any

      let source = input as Record<string, any>

      for (let key in fields) {
        let FieldType = fields[key]
        let field = source[key]
        let result = FieldType.validate(field)

        if (result.isErr) return result

        object[key] = result.value
      }

      return Ok(object as ObjectType)
    },
  })

  return Type
}

export const Nullable = <T extends Type>(Type: T): Type<RawType<T> | null | undefined> => {
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

export const Union = <T extends Type[]>(...Types: T): Type<RawUnionItemType<T[number]>> => {
  let Type: Type<RawUnionItemType<T[number]>> = createType({
    toJSON: () => {
      return {
        type: 'Union',
        contentTypes: Types.map((Type) => Type.toJSON()),
      }
    },
    validate: (input) => {
      let list: string[] = []
      for (let i = 0; i < Types.length; i++) {
        let Type = Types[i]
        let result = Type.validate(input)
        if (result.isOk) return result
        list.push(result.value)
      }
      return Err(`${input} is not the union type, messages:\n${list.join('\n')}`)
    },
  })

  return Type
}

export type LiteralType = string | number | boolean | null | undefined

export const Literal = <T extends LiteralType>(literal: T): Type<T> => {
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
        return Err(`${input} is not equal to ${literal}`)
      }
    },
  })
}

export const Record = <T extends Type>(Type: T): Type<Record<string, RawType<T>>> => {
  let ResultType: Type<Record<string, RawType<T>>> = createType({
    toJSON: () => {
      return {
        type: 'Record',
        valueType: Type.toJSON(),
      }
    },
    validate: (input) => {
      if (typeof input !== 'object') {
        return Err(`${input} is not an object`)
      }

      if (input === null) {
        return Err(`null is not an object`)
      }

      if (Array.isArray(input)) {
        return Err(`${input} is not an object`)
      }

      let record = {} as Record<string, RawType<T>>

      let source = input as any

      for (let key in source) {
        let value = source[key]
        let result = Type.validate(value)
        if (result.isErr) return result
        record[key] = result.value
      }

      return Ok(record)
    },
  })

  return ResultType
}

export type ObjectType = Type<Record<string, any>>

export type ListType = Type<any[]>

export const Path = (path: string) => {
  let match = createMatch(path)
  return String.create({
    toJSON: () => {
      return {
        type: 'Path',
        path: path,
      }
    },
    validate: (path) => {
      let matches = match(path)
      if (!matches) {
        return Err(`${path} is not matched the path: ${path}`)
      }
      let params = matches.params
      return Ok(params)
    },
  })
}

export type JsonType = Type<Json>

export const Json: JsonType = Thunk(() => {
  return Union(Number, String, Boolean, Literal(null), List(Json), Record(Json))
})

// tslint:disable-next-line: variable-name
export const Any = createType<any>({
  toJSON: () => {
    return {
      type: 'Any',
    }
  },
  validate: (input) => {
    return Ok(input as any)
  },
})
