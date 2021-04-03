import * as S from './schema'
import { SchemaCtor, TypeOf, Schema, SchemaTypeOf } from './schema'

import { getInstance } from './instance'
import { Result, Err, Ok } from './result'

export type ValidationError = {
  path?: (string | number)[]
  message: string
}

export type ValidationResult<T = any> = Result<T, ValidationError>

export const SchemaErr = (message: string, path?: ValidationError['path']): Err<ValidationError> => {
  return Err({
    path,
    message,
  })
}

export type ValidatorOptions = {
  strict?: boolean
}

export type Validator<T = any> = (input: unknown, options?: ValidatorOptions) => ValidationResult<T>

export type ValidatorMethods<T extends Schema = Schema> = {
  validate: Validator<TypeOf<T>>
}

export type ValidatorImpl<T extends Schema = Schema> = ValidatorMethods<T> | ((schema: T) => ValidatorMethods<T>)

const validatorWeakMap = new WeakMap<Function, ValidatorImpl>()

const getValidatorImpl = (input: Function): ValidatorImpl | undefined => {
  if (typeof input !== 'function') {
    return undefined
  }

  if (validatorWeakMap.has(input)) {
    return validatorWeakMap.get(input)
  }

  let next = Object.getPrototypeOf(input)

  if (next === Function.prototype) {
    return undefined
  }

  return getValidatorImpl(next)
}

export const Validator = {
  impl<T extends Schema>(Ctor: abstract new () => T, impl: ValidatorImpl<T>) {
    validatorWeakMap.set(Ctor, impl as ValidatorImpl)
  },

  get<T extends SchemaCtor>(Ctor: T): ValidatorImpl<SchemaTypeOf<T>> | undefined {
    let finalCtor = S.getSchemaCtor(Ctor)
    return getValidatorImpl(finalCtor as Function) as ValidatorImpl<SchemaTypeOf<T>> | undefined
  },

  validate<T extends SchemaCtor>(Ctor: T, input: unknown, options?: ValidatorOptions): ValidationResult<TypeOf<T>> {
    let validatorImpl = Validator.get(Ctor)

    if (!validatorImpl) {
      throw new Error(`No impl found for Validator, Ctor: ${Ctor}`)
    }

    // instantiation validator and save to weak-map
    if (typeof validatorImpl === 'function') {
      let schema = getInstance(Ctor) as SchemaTypeOf<T>
      let impl = validatorImpl(schema)
      validatorWeakMap.set(Ctor, impl)
      return impl.validate(input, options) as ValidationResult<TypeOf<T>>
    }

    return validatorImpl.validate(input, options) as ValidationResult<TypeOf<T>>
  },
}

Validator.impl(S.String, {
  validate: (input) => {
    if (typeof input === 'string') {
      return Ok(input)
    }
    return SchemaErr(`${input} is not a string`)
  },
})

const isNumber = (input: unknown): input is number => {
  return typeof input === 'number' && !isNaN(input)
}

const parseNumberLiteral = (input: unknown): Result<number> => {
  if (typeof input === 'string') {
    let value = parseFloat(input)
    if (isNumber(value)) {
      return Ok(value)
    }
  }
  return Err(`Expected a string, but got ${input}`)
}

Validator.impl(S.Number, {
  validate: (input, options) => {
    if (isNumber(input)) return Ok(input)

    if (options?.strict === false) {
      let result = parseNumberLiteral(input)
      if (result.isOk) return result
    }

    return SchemaErr(`${input} is not a number`)
  },
})

Validator.impl(S.Int, {
  validate: (input, options) => {
    if (typeof input === 'number' && Number.isInteger(input)) {
      return Ok(input)
    }

    if (options?.strict === false) {
      if (isNumber(input)) return Ok(Math.floor(input))
      let result = parseNumberLiteral(input)
      if (result.isOk) return Ok(Math.floor(result.value))
    }

    return SchemaErr(`${input} is not an integer`)
  },
})

Validator.impl(S.Float, {
  validate: (input, options) => {
    if (typeof input === 'number' && !isNaN(input)) {
      return Ok(input)
    }

    if (options?.strict === false) {
      let result = parseNumberLiteral(input)
      if (result.isOk) return result
    }

    return SchemaErr(`${input} is not a number`)
  },
})

Validator.impl(S.ID, {
  validate: (input) => {
    if (typeof input === 'string') {
      if (input === '') {
        return SchemaErr(`ID can't be empty.`)
      }
      return Ok(input)
    }

    return SchemaErr(`${input} is not an ID`)
  },
})

const parseBooleanLiteral = (input: unknown): Result<boolean> => {
  if (input === 'false') return Ok(false)
  if (input === 'true') return Ok(true)
  return Err('')
}

Validator.impl(S.Boolean, {
  validate: (input, options) => {
    if (typeof input === 'boolean') {
      return Ok(input)
    }

    if (options?.strict === false) {
      let result = parseBooleanLiteral(input)
      if (result.isOk) return result
    }

    return SchemaErr(`${input} is not a boolean`)
  },
})

Validator.impl<S.LiteralType>(S.LiteralType, (schema) => ({
  validate: (input, options) => {
    let value = schema.value
    if (input === value) {
      return Ok(input as S.Literals)
    }

    if (options?.strict === false && typeof value !== 'string') {
      if (typeof value === 'number') {
        let result = parseNumberLiteral(input)
        if (result.isOk) return result
      } else if (typeof value === 'boolean') {
        let result = parseBooleanLiteral(input)
        if (result.isOk) return result
      }
    }

    return SchemaErr(`${input} is not a literal ${value}`)
  },
}))

Validator.impl<S.ListType>(S.ListType, (schema) => ({
  validate: (input, options) => {
    if (!Array.isArray(input)) {
      return SchemaErr(`${input} is not a list`)
    }

    let results = []

    for (let i = 0; i < input.length; i++) {
      let item = input[i]
      let result = Validator.validate(schema.Item, item, options)

      if (result.isErr) {
        return SchemaErr(result.value.message, [i, ...(result.value.path ?? [])])
      }

      results.push(result.value)
    }

    return Ok(results)
  },
}))

type Fields = {
  [key: string]: S.SchemaCtor
}

const getFieldsDescriptor = (descriptors: S.FieldDescriptors): Fields => {
  let fields = {} as Fields

  for (let [key, field] of Object.entries(descriptors)) {
    if (S.isFieldDescriptor(field)) {
      if (typeof field === 'function') {
        fields[key] = field
      } else {
        fields[key] = field[S.Type]
      }
    } else if (S.isFieldDescriptors(field)) {
      fields[key] = S.Struct(getFieldsDescriptor(field))
    }
  }

  return fields
}

Validator.impl<S.StructType>(S.StructType, (schema) => {
  let fields = getFieldsDescriptor(schema.descriptors)

  return {
    validate: (input, options) => {
      if (typeof input !== 'object' || !input) {
        return SchemaErr(`${input} is not an object`)
      }

      let results = {}

      for (let key in fields) {
        let Field = fields[key]
        let value = input[key]
        let result = Validator.validate(Field, value, options)

        if (result.isErr) {
          return SchemaErr(result.value.message, [key, ...(result.value.path ?? [])])
        }

        results[key] = result.value
      }

      return Ok(results)
    },
  }
})

Validator.impl(S.ObjectType, (schema) => {
  let fields = getFieldsDescriptor((schema as unknown) as S.FieldDescriptors)
  let Fields = S.Struct(fields)

  return {
    validate: (input, options) => {
      // console.log({ input, options, schema })
      return Validator.validate(Fields, input, options)
    },
  }
})

Validator.impl<S.RecordType>(S.RecordType, (schema) => {
  return {
    validate: (input, options) => {
      if (typeof input !== 'object' || !input) {
        return SchemaErr(`${input} is not an object`)
      }

      let results = {}

      for (let [key, value] of Object.entries(input)) {
        let result = Validator.validate(schema.Item, value, options)

        if (result.isErr) {
          return SchemaErr(result.value.message, [key, ...(result.value.path ?? [])])
        }

        results[key] = result.value
      }

      return Ok(results)
    },
  }
})

Validator.impl<S.NullableType>(S.NullableType, (schema) => {
  return {
    validate: (input, options) => {
      if (input === null || input === undefined) {
        return Ok(input)
      }
      return Validator.validate(schema.Item, input, options)
    },
  }
})

Validator.impl<S.UnionType>(S.UnionType, (schema) => {
  return {
    validate: (input, options) => {
      let messages: string[] = []

      for (let Item of schema.Items) {
        let result = Validator.validate(Item, input, options)
        if (result.isOk) return result
        messages.push(result.value.message)
      }

      return SchemaErr(`Matched unions failed: \n${messages.join('\n&\n')}`)
    },
  }
})

Validator.impl<S.IntersectType>(S.IntersectType, (schema) => {
  return {
    validate: (input, options) => {
      let results = {}

      for (let Item of schema.Items) {
        let result = Validator.validate(Item, input, options)
        if (result.isErr) return result
        Object.assign(results, result.value)
      }

      return Ok(results as any)
    },
  }
})

const validateJson: Validator<S.JsonType> = (input) => {
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean' || input === null) {
    return Ok(input)
  }

  if (Array.isArray(input)) {
    for (let value of input) {
      let result = validateJson(value)
      if (result.isErr) return result
    }

    return Ok(input)
  }

  if (typeof input === 'object' && input) {
    for (let value of Object.values(input)) {
      let result = validateJson(value)
      if (result.isErr) return result
    }

    return Ok(input as S.JsonType)
  }

  throw new Error(`${input} is not a valid json`)
}

Validator.impl<S.Json>(S.Json, {
  validate: validateJson,
})

Validator.impl(S.Any, {
  validate: (input) => Ok(input),
})

Validator.impl(S.Unknown, {
  validate: (input) => Ok(input),
})

Validator.impl<S.StrictType>(S.StrictType, (schema) => {
  return {
    validate: (input, options) => {
      return Validator.validate(schema.Item, input, {
        ...options,
        strict: true,
      })
    },
  }
})

Validator.impl<S.NonStrictType>(S.NonStrictType, (schema) => {
  return {
    validate: (input, options) => {
      return Validator.validate(schema.Item, input, {
        ...options,
        strict: false,
      })
    },
  }
})

Validator.impl<S.ReadOnlyType>(S.ReadOnlyType, (schema) => {
  return {
    validate: (input, options): ValidationResult<any> => {
      return Validator.validate(schema.Item, input, options)
    },
  }
})

Validator.impl<S.ReadOnlyDeepType>(S.ReadOnlyDeepType, (schema) => {
  return {
    validate: (input, options): ValidationResult<any> => {
      return Validator.validate(schema.Item, input, options)
    },
  }
})



export const createSchemaValidator = <S extends S.SchemaCtor>(SchemaCtor: S, options?: ValidatorOptions) => {
  return (input: unknown) => {
    return Validator.validate(SchemaCtor, input, options)
  }
}

export abstract class ValidatorType<T = unknown> extends S.Schema<T> {
  __kind = S.kind('Validator')

  abstract validate(input: unknown): ValidationResult<T>

  Ok(value: T): ValidationResult<T> {
    return Ok(value)
  }

  Err(...args: Parameters<typeof SchemaErr>): ValidationResult<T> {
    return SchemaErr(...args)
  }
}

Validator.impl<ValidatorType>(ValidatorType, schema => {
  return {
    validate: schema.validate.bind(schema)
  }
})

export const RegExp = (regexp: RegExp) => {
  return class RegExp extends ValidatorType<string> {
    validate(input: unknown) {
      let text = `${input}`

      if (regexp.test(text)) {
        return this.Ok(text)
      }

      return this.Err(`${text} was not matched: ${regexp}`)
    }
  }
}