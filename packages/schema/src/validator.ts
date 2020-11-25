import * as Schema from './schema'
import { Err, Ok, Result } from './result'
import { createTransformer, TransformRule, TransformContext } from './transformer'

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

export type Validator<T = any> = (input: unknown) => ValidationResult<T>

export type ValidatorRule<S extends Schema.Schema, Context extends {} = {}> = TransformRule<
  S,
  Validator<Schema.TypeOf<S>>,
  Context
>

export type ValidatorRules<Context extends {} = {}> = {
  [key: string]: ValidatorRule<any, Context>
}

export const createValidator = <S extends Schema.SchemaCtor, Context = {}>(
  SchemaCtor: S,
  context: TransformContext<Context, Validator>,
): Validator<Schema.TypeOf<S>> => {
  let transformer = createTransformer(context)

  let validator: Validator<Schema.TypeOf<S>> | undefined

  return (input) => {
    if (validator) {
      return validator(input)
    }
    validator = transformer(SchemaCtor)
    return validator(input)
  }
}

export const createStrictValidator = <T extends Schema.SchemaCtor>(SchemaCtor: T) => {
  return createValidator(SchemaCtor, {
    rules: defaultValidatorRules,
  })
}

export const createNonStrictValidator = <T extends Schema.SchemaCtor>(SchemaCtor: T) => {
  return createValidator(SchemaCtor, {
    rules: loose(defaultValidatorRules),
  })
}

const StringValidatorRule: ValidatorRule<Schema.String> = {
  test: (schema) => {
    return schema instanceof Schema.String
  },
  transform: () => {
    return (input) => {
      if (typeof input === 'string') {
        return Ok(input)
      }
      return SchemaErr(`${input} is not a string`)
    }
  },
}

const NumberValidatorRule: ValidatorRule<Schema.Number> = {
  test: (schema) => {
    return schema instanceof Schema.Number
  },
  transform: () => {
    return (input) => {
      if (typeof input === 'number') {
        return Ok(input)
      }
      return SchemaErr(`${input} is not a number`)
    }
  },
}

const IntValidatorRule: ValidatorRule<Schema.Int> = {
  test: (schema) => {
    return schema instanceof Schema.Int
  },
  transform: () => {
    return (input) => {
      if (typeof input === 'number' && Number.isInteger(input)) {
        return Ok(input)
      }
      return SchemaErr(`${input} is not an integer`)
    }
  },
}

const FloatValidatorRule: ValidatorRule<Schema.Float> = {
  test: (schema) => {
    return schema instanceof Schema.Float
  },
  transform: () => {
    return (input) => {
      if (typeof input === 'number') {
        return Ok(input)
      }
      return SchemaErr(`${input} is not a number`)
    }
  },
}

const IDValidatorRule: ValidatorRule<Schema.ID> = {
  test: (schema) => {
    return schema instanceof Schema.ID
  },
  transform: () => {
    return (input) => {
      if (typeof input === 'string') {
        if (input === '') {
          return SchemaErr(`ID can't be empty.`)
        }
        return Ok(input)
      }

      return SchemaErr(`${input} is not an ID`)
    }
  },
}

const BooleanValidatorRule: ValidatorRule<Schema.Boolean> = {
  test: (schema) => {
    return schema instanceof Schema.Boolean
  },
  transform: () => {
    return (input) => {
      if (typeof input === 'boolean') {
        return Ok(input)
      }
      return SchemaErr(`${input} is not a boolean`)
    }
  },
}

const LiteralValidatorRule: ValidatorRule<Schema.LiteralType> = {
  test: (schema) => {
    return schema instanceof Schema.LiteralType
  },
  transform: (schema) => {
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
  transform: (schema, context) => {
    let validateItem = createValidator(schema.Item, context)

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

const createFieldsValidators = <T extends Schema.FieldDescriptors>(
  descriptors: T,
  context: TransformContext<any>,
): FieldsValidators<Schema.TypeOfFieldDescriptors<T>> => {
  let fieldsValidators = {}

  for (let [key, field] of Object.entries(descriptors)) {
    if (!Schema.isFieldDescriptor(field)) {
      if (Schema.isFieldDescriptors(field)) {
        fieldsValidators[key] = createValidator(Schema.Struct(field), context)
      }
      continue
    }

    if (typeof field === 'function') {
      fieldsValidators[key] = createValidator(field, context)
    } else {
      fieldsValidators[key] = createValidator(field[Schema.Type], context)
    }
  }

  return fieldsValidators as FieldsValidators<Schema.TypeOfFieldDescriptors<T>>
}

const ObjectValidatorRule: ValidatorRule<Schema.ObjectType | Schema.StructType> = {
  test: (schema) => {
    return schema instanceof Schema.ObjectType || schema instanceof Schema.StructType
  },
  transform: (schema, context) => {
    let descriptors = (schema instanceof Schema.StructType ? schema.descriptors : schema) as Schema.FieldDescriptors
    let fieldsValidators = createFieldsValidators(descriptors, context)

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
  transform: (schema, context) => {
    let validateItem = createValidator(schema.Item, context)

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
  transform: (schema, context) => {
    let validateItem = createValidator(schema.Item, context)

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
  transform: (schema, context) => {
    let itemsValidators = (schema.Items as Schema.SchemaCtor[]).map((Item) => createValidator(Item, context))

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
  transform: (schema, context) => {
    let itemsValidators = schema.Items.map((Item) => createValidator(Item, context))

    return (input) => {
      let results = {}

      for (let i = 0; i < itemsValidators.length; i++) {
        let validateItem = itemsValidators[i]
        let result = validateItem(input)
        if (result.isErr) return result
        Object.assign(results, result.value)
      }

      return Ok(results as any)
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

export const defaultValidatorRules = {
  String: StringValidatorRule,
  Boolean: BooleanValidatorRule,
  Number: NumberValidatorRule,
  Int: IntValidatorRule,
  Float: FloatValidatorRule,
  ID: IDValidatorRule,
  List: ListValidatorRule,
  Object: ObjectValidatorRule,
  Union: UnionValidatorRule,
  Intersect: IntersectValidatorRule,
  Nullable: NullableValidatorRule,
  Json: JsonValidatorRule,
  Any: AnyValidatorRule,
  Literal: LiteralValidatorRule,
  Record: RecordValidatorRule,
}

export type DefaultValidatorRules = typeof defaultValidatorRules

export const loose = <T extends DefaultValidatorRules>(rules: T): T => {
  return {
    ...rules,
    Number: {
      ...rules.Number,
      transform: (schema, context) => {
        let validator = rules.Number.transform(schema, context)
        return (input) => {
          let result = validator(input)

          if (result.isOk) return result

          if (typeof input === 'string') {
            let value = parseFloat(input)
            if (typeof value === 'number' && !isNaN(value)) {
              return Ok(value)
            }
          }
          return result
        }
      },
    },
    Int: {
      ...rules.Int,
      transform: (schema, context) => {
        let validator = rules.Int.transform(schema, context)

        return (input) => {
          let result = validator(input)

          if (result.isOk) return result

          if (typeof input === 'string') {
            input = parseFloat(input)
          }

          if (typeof input === 'number' && !isNaN(input)) {
            return Ok(Math.floor(input))
          }

          return result
        }
      },
    },
    Float: {
      ...rules.Float,
      transform: (schema, context) => {
        let validator = rules.Float.transform(schema, context)

        return (input) => {
          let result = validator(input)

          if (result.isOk) return result

          if (typeof input === 'string') {
            input = parseFloat(input)
          }

          if (typeof input === 'number' && !isNaN(input)) {
            return Ok(input)
          }

          return result
        }
      },
    },
    Boolean: {
      ...rules.Boolean,
      transform: (schema, context) => {
        let validator = rules.Boolean.transform(schema, context)
        return (input) => {
          let result = validator(input)

          if (result.isOk) return result

          if (typeof input === 'string') {
            if (input === 'false') return Ok(false)
            if (input === 'true') return Ok(true)
          }

          return result
        }
      },
    },
  }
}
