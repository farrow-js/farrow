import * as Schema from './schema'
import { Err, Ok, Result } from './result'
import { createTransformer, TransformRule } from './transformer'

export type ValidationError = {
  path?: (string | number)[]
  message: string
}

export type ValidationResult<T = any> = Result<T, ValidationError>

export type Validator<T = any> = (input: unknown) => ValidationResult<T>

export const SchemaErr = (message: string, path?: ValidationError['path']): Err<ValidationError> => {
  return Err({
    path,
    message,
  })
}

export type ValidatorRule<S extends Schema.Schema, Context extends {} = ValidatorContext> = TransformRule<
  S,
  Validator<Schema.TypeOf<S>>,
  Context & ValidatorContext
>

export type ValidatorRules<Context extends {} = ValidatorContext> = Array<ValidatorRule<any, Context>>

export const createValidator = <T extends Schema.SchemaCtor, Context = {}>(
  SchemaCtor: T,
  rules: ValidatorRules<Context>,
  context: Context,
) => {
  let transformer = createTransformer<Validator<Schema.TypeOf<T>>, Context>(rules, context)

  let validator: Validator<Schema.TypeOf<T>> | undefined

  return (input: unknown) => {
    if (validator) {
      return validator(input)
    }
    validator = transformer(SchemaCtor)
    return validator(input)
  }
}

export type ValidatorContext = {
  visitor?: {
    Number?: (input: any) => number | void
    Int?: (input: any) => number | void
    Float?: (input: any) => number | void
    String?: (input: any) => string | void
    Boolean?: (input: any) => boolean | void
    ID?: (input: any) => string | void
  }
}

export const createStrictValidator = <T extends Schema.SchemaCtor>(SchemaCtor: T, context: ValidatorContext = {}) => {
  return createValidator(
    SchemaCtor,
    [
      StringValidatorRule,
      BooleanValidatorRule,
      NumberValidatorRule,
      IntValidatorRule,
      FloatValidatorRule,
      IDValidatorRule,
      ListValidatorRule,
      ObjectValidatorRule,
      UnionValidatorRule,
      IntersectValidatorRule,
      NullableValidatorRule,
      JsonValidatorRule,
      AnyValidatorRule,
      LiteralValidatorRule,
      RecordValidatorRule,
    ],
    context,
  )
}

export const createNonStrictValidator = <T extends Schema.SchemaCtor>(SchemaCtor: T) => {
  return createStrictValidator(SchemaCtor, { visitor: NonStrictValidatorVisitor })
}

export const NonStrictValidatorVisitor: ValidatorContext['visitor'] = {
  Number: (input) => {
    if (typeof input === 'string') {
      let value = parseFloat(input)
      if (typeof value === 'number' && !isNaN(value)) {
        return value
      }
    }
  },
  Int: (input) => {
    if (typeof input === 'number') {
      return Math.floor(input)
    }
  },
  Boolean: (input) => {
    if (typeof input === 'string') {
      if (input === 'false') return false
      if (input === 'true') return true
    }
  },
}

const StringValidatorRule: ValidatorRule<Schema.String> = {
  test: (schema) => {
    return schema instanceof Schema.String
  },
  transform: (schema, context) => {
    let handleString = context.visitor?.String

    return (input) => {
      if (typeof input === 'string') {
        return Ok(input)
      }

      if (handleString) {
        let value = handleString(input)
        if (typeof value === 'string') {
          return Ok(value)
        }
      }

      return SchemaErr(`${input} is not a string`)
    }
  },
}

const NumberValidatorRule: ValidatorRule<Schema.Number> = {
  test: (schema) => {
    return schema instanceof Schema.Number
  },
  transform: (schema, context) => {
    let handleNumber = context.visitor?.Number

    return (input) => {
      if (typeof input === 'number') {
        return Ok(input)
      }

      if (handleNumber) {
        let value = handleNumber(input)
        if (typeof value === 'number') {
          return Ok(value)
        }
      }

      return SchemaErr(`${input} is not a number`)
    }
  },
}

const IntValidatorRule: ValidatorRule<Schema.Int> = {
  test: (schema) => {
    return schema instanceof Schema.Int
  },
  transform: (schema, context, rules) => {
    let handleInt = context.visitor?.Int
    let validateNumber = createValidator(Schema.Number, rules, context)

    return (input) => {
      let result = validateNumber(input)

      if (result.isOk && Number.isInteger(result.value)) {
        return result
      }

      if (handleInt) {
        let value = handleInt(result.isOk ? result.value : input)
        if (typeof value === 'number') {
          return Ok(value)
        }
      }

      return SchemaErr(`${input} is not an integer`)
    }
  },
}

const FloatValidatorRule: ValidatorRule<Schema.Float> = {
  test: (schema) => {
    return schema instanceof Schema.Float
  },
  transform: (schema, context, rules) => {
    let handleFloat = context.visitor?.Float
    let validateNumber = createValidator(Schema.Number, rules, context)

    return (input) => {
      let result = validateNumber(input)

      if (result.isOk) {
        return result
      }

      if (handleFloat) {
        let value = handleFloat(input)
        if (typeof value === 'number') {
          return Ok(value)
        }
      }

      return SchemaErr(`${input} is not a float`)
    }
  },
}

const IDValidatorRule: ValidatorRule<Schema.ID> = {
  test: (schema) => {
    return schema instanceof Schema.ID
  },
  transform: (schema, context, rules) => {
    let handleID = context?.visitor?.ID
    let validateString = createValidator(Schema.String, rules, context)

    return (input) => {
      let result = validateString(input)

      if (result.isOk) {
        if (result.value === '') {
          return SchemaErr(`ID can't be empty. input: ${input}`)
        }

        return result
      }

      if (handleID) {
        let value = handleID(input)
        if (typeof value === 'string') {
          if (value === '') {
            return SchemaErr(`ID can't be empty`)
          }
          return Ok(value)
        }
      }

      return SchemaErr(`${input} is not an ID`)
    }
  },
}

const BooleanValidatorRule: ValidatorRule<Schema.Boolean> = {
  test: (schema) => {
    return schema instanceof Schema.Boolean
  },
  transform: (schema, context) => {
    let handleBoolean = context?.visitor?.Boolean

    return (input) => {
      if (typeof input === 'boolean') {
        return Ok(input)
      }

      if (handleBoolean) {
        let value = handleBoolean(input)
        if (typeof value === 'boolean') {
          return Ok(value)
        }
      }

      return SchemaErr(`${input} is not a boolean`)
    }
  },
}

const LiteralValidatorRule: ValidatorRule<Schema.LiteralType> = {
  test: (schema) => {
    return schema instanceof Schema.LiteralType
  },
  transform: (schema, context, rules) => {
    let value = schema.value

    return (input) => {
      if (input === value) {
        return Ok(input as Schema.Literals)
      }
      return SchemaErr(`${input} is not a literal ${value}`)
    }
  },
}

const ListValidatorRule: ValidatorRule<Schema.ListType> = {
  test: (schema) => {
    return schema instanceof Schema.ListType
  },
  transform: (schema, context, rules) => {
    let validateItem = createValidator(schema.Item, rules, context)

    return (input) => {
      if (!Array.isArray(input)) {
        return SchemaErr(`${input} is not a list`)
      }

      let results = []

      for (let i = 0; i < input.length; i++) {
        let item = input[i]
        let result = validateItem(item)

        if (result.isErr) {
          return SchemaErr(result.value.message, [i, ...(result.value.path ?? [])])
        }

        results.push(result.value)
      }

      return Ok(results)
    }
  },
}

type FieldsValidators<T> = {
  [key in keyof T]: Validator<T[key]>
}

const createFieldsValidators = <T extends Schema.FieldDescriptors, Context extends {}>(
  descriptors: T,
  rules: ValidatorRules<Context>,
  context: Context,
): FieldsValidators<Schema.TypeOfFieldDescriptors<T>> => {
  let fieldsValidators = {}

  for (let [key, field] of Object.entries(descriptors)) {
    if (!Schema.isFieldDescriptor(field)) {
      if (Schema.isFieldDescriptors(field)) {
        fieldsValidators[key] = createValidator(Schema.Struct(field), rules, context)
      }
      continue
    }

    if (typeof field === 'function') {
      fieldsValidators[key] = createValidator(field, rules, context)
    } else {
      fieldsValidators[key] = createValidator(field[Schema.Type], rules, context)
    }
  }

  return fieldsValidators as FieldsValidators<Schema.TypeOfFieldDescriptors<T>>
}

const ObjectValidatorRule: ValidatorRule<Schema.ObjectType | Schema.StructType> = {
  test: (schema) => {
    return schema instanceof Schema.ObjectType || schema instanceof Schema.StructType
  },
  transform: (schema, context, rules) => {
    let descriptors = (schema instanceof Schema.StructType ? schema.descriptors : schema) as Schema.FieldDescriptors
    let fieldsValidators = createFieldsValidators(descriptors, rules, context)

    return (input) => {
      if (typeof input !== 'object' || !input) {
        return SchemaErr(`${input} is not an object`)
      }

      let results = {}

      for (let key in fieldsValidators) {
        let validate = fieldsValidators[key]
        let result = validate(input[key])

        if (result.isErr) {
          return SchemaErr(result.value.message, [key, ...(result.value.path ?? [])])
        }

        results[key] = result.value
      }

      return Ok(results)
    }
  },
}

const RecordValidatorRule: ValidatorRule<Schema.RecordType> = {
  test: (schema) => {
    return schema instanceof Schema.RecordType
  },
  transform: (schema, context, rules) => {
    let validateItem = createValidator(schema.Item, rules, context)

    return (input) => {
      if (typeof input !== 'object' || !input) {
        return SchemaErr(`${input} is not an object`)
      }

      let results = {}

      for (let [key, value] of Object.entries(input)) {
        let result = validateItem(value)
        if (result.isErr) {
          return SchemaErr(result.value.message, [key, ...(result.value.path ?? [])])
        }

        results[key] = result.value
      }

      return Ok(results)
    }
  },
}

const NullableValidatorRule: ValidatorRule<Schema.NullableType> = {
  test: (schema) => {
    return schema instanceof Schema.NullableType
  },
  transform: (schema, context, rules) => {
    let validateItem = createValidator(schema.Item, rules, context)

    return (input) => {
      if (input === null || input === undefined) {
        return Ok(input)
      }
      return validateItem(input)
    }
  },
}

const UnionValidatorRule: ValidatorRule<Schema.UnionType> = {
  test: (schema) => {
    return schema instanceof Schema.UnionType
  },
  transform: (schema, context, rules) => {
    let itemsValidators = (schema.Items as Schema.SchemaCtor[]).map((Item) => createValidator(Item, rules, context))

    return (input) => {
      let messages: string[] = []

      for (let i = 0; i < itemsValidators.length; i++) {
        let validateItem = itemsValidators[i]
        let result = validateItem(input)
        if (result.isOk) return result
        messages.push(result.value.message)
      }

      return SchemaErr(`Matched unions failed: \n${messages.join('\n&\n')}`)
    }
  },
}

const IntersectValidatorRule: ValidatorRule<Schema.IntersectType> = {
  test: (schema) => {
    return schema instanceof Schema.IntersectType
  },
  transform: (schema, context, rules) => {
    let itemsValidators = (schema.Items as Schema.SchemaCtor[]).map((Item) => createValidator(Item, rules, context))

    return (input) => {
      let results = {}

      for (let i = 0; i < itemsValidators.length; i++) {
        let validateItem = itemsValidators[i]
        let result = validateItem(input)
        if (result.isErr) return result
        Object.assign(results, result.value)
      }

      return Ok(results as Schema.TypeOf<typeof schema>)
    }
  },
}

let validateJson: Validator<Schema.JsonType> = (input) => {
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

    return Ok(input as Schema.JsonType)
  }

  throw new Error(`${input} is not a valid json`)
}

const JsonValidatorRule: ValidatorRule<Schema.Json> = {
  test: (schema) => {
    return schema instanceof Schema.Json
  },
  transform: (schema) => {
    return validateJson
  },
}

const AnyValidatorRule: ValidatorRule<Schema.Any> = {
  test: (schema) => {
    return schema instanceof Schema.Any
  },
  transform: (schema) => {
    return (input) => Ok(input)
  },
}
