import * as S from './schema'
import { SchemaCtor, TypeOf } from './schema'

import { getInstance, InstanceTypeOf } from './instance'
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

export type ValidatorImpl<T extends SchemaCtor = SchemaCtor> = {
  validate: Validator<TypeOf<T>>
}

const validatorWeakMap = new WeakMap<SchemaCtor, ValidatorImpl>()

export type ImplOptions<T extends SchemaCtor> = ValidatorImpl<T> | ((schema: InstanceTypeOf<T>) => ValidatorImpl<T>)

export const Validator = {
  impl<T extends SchemaCtor>(Ctor: T, impl: ImplOptions<T>) {
    if (typeof impl === 'function') {
      let instance = getInstance(Ctor)
      validatorWeakMap.set(Ctor, impl(instance))
    } else {
      validatorWeakMap.set(Ctor, impl)
    }
  },
  get<T extends SchemaCtor>(Ctor: T): ValidatorImpl<T> | undefined {
    return (validatorWeakMap.get(Ctor) as unknown) as ValidatorImpl<T> | undefined
  },
  validate<T extends SchemaCtor>(Ctor: T, value: unknown, options?: ValidatorOptions): ValidationResult<TypeOf<T>> {
    let validatorImpl = Validator.get(Ctor)

    if (!validatorImpl) {
      throw new Error(`No impl found for Validator, Ctor: ${Ctor}`)
    }

    return validatorImpl.validate(value, options)
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

// type T0 = InstanceTypeOf<new () => S.LiteralType>

// Validator.impl(S.LiteralType, (schema) => ({
//   validate: (input) => {
//     if (input === value) {
//       return Ok(input as Schema.Literals)
//     }

//     if (strict === false && typeof value !== 'string') {
//       if (typeof value === 'number') {
//         let result = parseNumberLiteral(input)
//         if (result.isOk) return result
//       } else if (typeof value === 'boolean') {
//         let result = parseBooleanLiteral(input)
//         if (result.isOk) return result
//       }
//     }

//     return SchemaErr(`${input} is not a literal ${value}`)
//   },
// }))
