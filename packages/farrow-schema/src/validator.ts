import * as Schema from './schema'
import { Err, Ok, Result } from './result'
import { createTransformer, TransformRule, TransformContext } from './transformer'

export abstract class ValidatorType<T> extends Schema.Schema<T> {
  __kind = Schema.kind('Validator')

  abstract validate(input: unknown): ValidationResult<T>

  Ok(value: T): ValidationResult<T> {
    return Ok(value)
  }

  Err(...args: Parameters<typeof SchemaErr>): ValidationResult<T> {
    return SchemaErr(...args)
  }
}

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

export type ValidatorContext = {
  strict?: boolean
  validatorCache?: WeakMap<Schema.SchemaCtor, Validator>
}

export type ValidatorRule<S extends Schema.Schema, Context extends ValidatorContext = ValidatorContext> = TransformRule<
  S,
  Validator<Schema.TypeOf<S>>,
  Context
>

export const createValidator = <S extends Schema.SchemaCtor, Context extends ValidatorContext = ValidatorContext>(
  SchemaCtor: S,
  context: TransformContext<Context, Validator>,
): Validator<Schema.TypeOf<S>> => {
  if (context.validatorCache?.has(SchemaCtor)) {
    return context.validatorCache?.get(SchemaCtor)!
  }

  let transformer = createTransformer(context)

  let validate: Validator<Schema.TypeOf<S>> | undefined

  let validator: Validator<Schema.TypeOf<S>> = (input) => {
    if (validate) {
      return validate(input)
    }

    if (SchemaCtor.prototype instanceof ValidatorType) {
      let schema = new SchemaCtor() as ValidatorType<any>
      validate = schema.validate.bind(schema)
    } else {
      validate = transformer(SchemaCtor)
    }

    return validate(input)
  }

  context.validatorCache?.set(SchemaCtor, validator)

  return validator
}

export const createSchemaValidator = <S extends Schema.SchemaCtor, Context extends ValidatorContext = ValidatorContext>(
  SchemaCtor: S,
  context?: TransformContext<Context, Validator>,
) => {
  return createValidator(SchemaCtor, {
    ...context,
    validatorCache: new WeakMap(),
    rules: {
      ...defaultValidatorRules,
      ...context?.rules,
    },
  })
}

const StrictValidatorRule: ValidatorRule<Schema.StrictType> = {
  test: (schema) => {
    return schema instanceof Schema.StrictType
  },
  transform: (schema, context) => {
    return createValidator(schema.Item, {
      ...context,
      strict: true,
    })
  },
}

const NonStrictValidatorRule: ValidatorRule<Schema.NonStrictType> = {
  test: (schema) => {
    return schema instanceof Schema.NonStrictType
  },
  transform: (schema, context) => {
    return createValidator(schema.Item, {
      ...context,
      strict: false,
    })
  },
}

const ReadOnlyValidatorRule: ValidatorRule<Schema.ReadOnlyType> = {
  test: (schema) => {
    return schema instanceof Schema.ReadOnlyType
  },
  transform: (schema, context) => {
    return createValidator(schema.Item, context) as Validator<Readonly<unknown>>
  },
}

const ReadOnlyDeepValidatorRule: ValidatorRule<Schema.ReadOnlyDeepType> = {
  test: (schema) => {
    return schema instanceof Schema.ReadOnlyDeepType
  },
  transform: (schema, context) => {
    return createValidator(schema.Item, context) as Validator<Readonly<unknown>>
  },
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
  return Err('')
}

const NumberValidatorRule: ValidatorRule<Schema.Number> = {
  test: (schema) => {
    return schema instanceof Schema.Number
  },
  transform: (_, { strict }) => {
    return (input) => {
      if (isNumber(input)) return Ok(input)

      if (strict === false) {
        let result = parseNumberLiteral(input)
        if (result.isOk) return result
      }

      return SchemaErr(`${input} is not a number`)
    }
  },
}

const IntValidatorRule: ValidatorRule<Schema.Int> = {
  test: (schema) => {
    return schema instanceof Schema.Int
  },
  transform: (_, { strict }) => {
    return (input) => {
      if (typeof input === 'number' && Number.isInteger(input)) {
        return Ok(input)
      }

      if (strict === false) {
        if (isNumber(input)) return Ok(Math.floor(input))
        let result = parseNumberLiteral(input)
        if (result.isOk) return Ok(Math.floor(result.value))
      }

      return SchemaErr(`${input} is not an integer`)
    }
  },
}

const FloatValidatorRule: ValidatorRule<Schema.Float> = {
  test: (schema) => {
    return schema instanceof Schema.Float
  },
  transform: (_, { strict }) => {
    return (input) => {
      if (typeof input === 'number' && !isNaN(input)) {
        return Ok(input)
      }

      if (strict === false) {
        let result = parseNumberLiteral(input)
        if (result.isOk) return result
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

const parseBooleanLiteral = (input: unknown): Result<boolean> => {
  if (input === 'false') return Ok(false)
  if (input === 'true') return Ok(true)
  return Err('')
}

const BooleanValidatorRule: ValidatorRule<Schema.Boolean> = {
  test: (schema) => {
    return schema instanceof Schema.Boolean
  },
  transform: (_, { strict }) => {
    return (input) => {
      if (typeof input === 'boolean') {
        return Ok(input)
      }

      if (strict === false) {
        let result = parseBooleanLiteral(input)
        if (result.isOk) return result
      }

      return SchemaErr(`${input} is not a boolean`)
    }
  },
}

const LiteralValidatorRule: ValidatorRule<Schema.LiteralType> = {
  test: (schema) => {
    return schema instanceof Schema.LiteralType
  },
  transform: (schema, { strict }) => {
    let { value } = schema

    return (input) => {
      if (input === value) {
        return Ok(input as Schema.Literals)
      }

      if (strict === false && typeof value !== 'string') {
        if (typeof value === 'number') {
          let result = parseNumberLiteral(input)
          if (result.isOk) return result
        } else if (typeof value === 'boolean') {
          let result = parseBooleanLiteral(input)
          if (result.isOk) return result
        }
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
  transform: (_schema) => {
    return validateJson
  },
}

const AnyValidatorRule: ValidatorRule<Schema.Any> = {
  test: (schema) => {
    return schema instanceof Schema.Any
  },
  transform: (_schema) => {
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
  Strict: StrictValidatorRule,
  NonStrict: NonStrictValidatorRule,
  ReadOnly: ReadOnlyValidatorRule,
  ReadOnlyDeep: ReadOnlyDeepValidatorRule,
}

export type DefaultValidatorRules = typeof defaultValidatorRules
