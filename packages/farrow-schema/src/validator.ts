import * as S from './schema'
import { SchemaCtor, TypeOf, Schema, SchemaTypeOf, getInstance } from './schema'

import { getSchemaCtorFields, PartialType } from './helper'
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

  const next = Object.getPrototypeOf(input)

  if (next === Function.prototype) {
    return undefined
  }

  return getValidatorImpl(next)
}

export const Validator = {
  impl<T extends Schema>(Ctor: abstract new () => T, impl: ValidatorImpl<T>) {
    validatorWeakMap.set(Ctor, impl as ValidatorImpl)
  },

  get<T extends SchemaCtor>(Ctor: T): ValidatorMethods<SchemaTypeOf<T>> | undefined {
    const finalCtor = S.getSchemaCtor(Ctor)
    const validatorImpl = getValidatorImpl(finalCtor as unknown as Function) as ValidatorImpl<SchemaTypeOf<T>> | undefined

    // instantiation validator and save to weak-map
    if (typeof validatorImpl === 'function') {
      const schema = getInstance(Ctor) as SchemaTypeOf<T>
      const impl = validatorImpl(schema)

      validatorWeakMap.set(Ctor, impl)

      return impl
    }

    return validatorImpl
  },

  validate<T extends SchemaCtor>(Ctor: T, input: unknown, options?: ValidatorOptions): ValidationResult<TypeOf<T>> {
    const validatorImpl = Validator.get(Ctor)

    if (!validatorImpl) {
      throw new Error(`No impl found for Validator, Ctor: ${Ctor}`)
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
    const value = parseFloat(input)
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
      const result = parseNumberLiteral(input)
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
      const result = parseNumberLiteral(input)
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
      const result = parseNumberLiteral(input)
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
      const result = parseBooleanLiteral(input)
      if (result.isOk) return result
    }

    return SchemaErr(`${input} is not a boolean`)
  },
})


Validator.impl(S.Date, {
  validate(input) {
    if (input instanceof Date) {
      return Ok(input)
    }

    if (typeof input === 'number') {
      return Ok(new Date(input))
    }

    if (typeof input === 'string') {
      const timestamp = Date.parse(input)

      if (Number.isNaN(timestamp)) {
        return SchemaErr(`${input} is not a valid date input`)
      }

      return Ok(new Date(timestamp))
    }

    return SchemaErr(`${input} is not a valid date input`)
  },
})

Validator.impl<S.LiteralType>(S.LiteralType, (schema) => ({
  validate: (input, options) => {
    const value = schema.value
    if (input === value) {
      return Ok(input as S.Literals)
    }

    if (options?.strict === false && typeof value !== 'string') {
      if (typeof value === 'number') {
        const result = parseNumberLiteral(input)
        if (result.isOk && result.value === value) return result
      } else if (typeof value === 'boolean') {
        const result = parseBooleanLiteral(input)
        if (result.isOk && result.value === value) return result
      }
    }

    return SchemaErr(`${input} is not a literal ${value}`)
  },
}))

Validator.impl<S.NullableType>(S.NullableType, schema => ({
  validate: (input, options) => {
    if (input === null) {
      return Ok(input)
    }
    return Validator.validate(schema.Item, input, options)
  }
}))

Validator.impl<S.OptionalType>(S.OptionalType, schema => ({
  validate: (input, options) => {
    if (input === undefined) {
      return Ok(input)
    }
    return Validator.validate(schema.Item, input, options)
  }
}))

Validator.impl<S.ListType>(S.ListType, (schema) => ({
  validate: (input, options) => {
    if (!Array.isArray(input)) {
      return SchemaErr(`${input} is not a list`)
    }

    const results = []

    for (let i = 0; i < input.length; i++) {
      const item = input[i]
      const result = Validator.validate(schema.Item, item, options)

      if (result.isErr) {
        return SchemaErr(result.value.message, [i, ...(result.value.path ?? [])])
      }

      results.push(result.value)
    }

    return Ok(results)
  },
}))

Validator.impl<S.StructType>(S.StructType, (schema) => {
  const fields = getSchemaCtorFields(schema.descriptors)

  return {
    validate: (input, options) => {
      if (typeof input === 'string') {
        if (options?.strict === false) {
          try {
            input = JSON.parse(input)
          } catch (e) {
            // ignore
          }
        }
      }

      if (typeof input !== 'object' || !input) {
        return SchemaErr(`${input} is not an object`)
      }

      const results = {}

      for (const key in fields) {
        const Field = fields[key]

        // @ts-ignore
        const value = input[key]
        const result = Validator.validate(Field[S.Type], value, options)

        if (result.isErr) {
          return SchemaErr(result.value.message, [key, ...(result.value.path ?? [])])
        }

        // @ts-ignore
        results[key] = result.value
      }

      return Ok(results)
    },
  }
})

Validator.impl(S.ObjectType, (schema) => {
  const fields = getSchemaCtorFields((schema as unknown) as S.FieldDescriptors)
  const Struct = S.Struct(fields)

  return {
    validate: (input, options) => {
      return Validator.validate(Struct, input, options)
    },
  }
})

Validator.impl<S.RecordType>(S.RecordType, (schema) => {
  return {
    validate: (input, options) => {
      if (typeof input !== 'object' || !input) {
        return SchemaErr(`${input} is not an object`)
      }

      const results = {}

      for (const [key, value] of Object.entries(input)) {
        const result = Validator.validate(schema.Item, value, options)

        if (result.isErr) {
          return SchemaErr(result.value.message, [key, ...(result.value.path ?? [])])
        }

        // @ts-ignore
        results[key] = result.value
      }

      return Ok(results)
    },
  }
})

Validator.impl<S.UnionType>(S.UnionType, (schema) => {
  return {
    validate: (input, options) => {
      const messages: string[] = []

      for (const Item of schema.Items) {
        if (Item === S.Never) continue
        const result = Validator.validate(Item, input, options)
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
      const results = {}

      for (const Item of schema.Items) {
        const result = Validator.validate(Item, input, options)
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
    for (const value of input) {
      const result = validateJson(value)
      if (result.isErr) return result
    }

    return Ok(input)
  }

  if (typeof input === 'object' && input) {
    for (const value of Object.values(input)) {
      const result = validateJson(value)
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

Validator.impl(S.Never, {
  validate: (input) => {
    throw new Error(`Should not validate here, got ${input}`)
  }
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


Validator.impl<S.TupleType>(S.TupleType, schema => {
  return {
    validate: (input, options): ValidationResult<any> => {
      if (!Array.isArray(input)) {
        return SchemaErr(`${input} is not an array`)
      }

      const tuple = [] as unknown[]

      for (let i = 0; i < schema.Items.length; i++) {
        const Item = schema.Items[i]
        const result = Validator.validate(Item, input[i], options)
        if (result.isErr) {
          return SchemaErr(result.value.message, [...(result.value.path ?? []), i])
        }
        tuple.push(result.value)
      }

      return Ok(tuple)
    }
  }
})

Validator.impl(PartialType, schema => {
  return {
    validate(input, options): ValidationResult<any> {
      return Validator.validate(schema.Item, input, options)
    }
  }
})

export const createSchemaValidator = <S extends S.SchemaCtor>(SchemaCtor: S, options?: ValidatorOptions) => {
  return (input: unknown) => {
    return Validator.validate(SchemaCtor, input, options)
  }
}

export abstract class ValidatorType<T = unknown> extends S.Schema {
  __type!: T

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
      const text = `${input}`

      if (regexp.test(text)) {
        return this.Ok(text)
      }

      return this.Err(`${text} was not matched: ${regexp}`)
    }
  }
}