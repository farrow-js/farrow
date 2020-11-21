import * as Schema from './schema'

import { Err, Ok, Result } from './result'

export type Transformer<T extends Schema.SchemaCtor, U> = (SchemaCtor: T) => U

const Cache = Symbol('cache')

type Cache = typeof Cache

export type TransformCache = { [Cache]: WeakMap<Schema.SchemaCtor, any> }

export type TransformRule<T extends Schema.Schema, U, Context extends {}> = {
  test: (schema: Schema.Schema) => boolean
  transform: (context: Context & TransformCache, rules: TransformRules<any, Context>) => (schema: T) => U
}

export const createTransformRule = <T extends Schema.Schema, U, Context extends {}>(
  rule: TransformRule<T, U, Context>,
) => {
  return rule
}

export type TransformRules<U, Context extends {}> = Array<TransformRule<Schema.Schema, U, Context>>

export const createTransformer = <U, Context extends {}>(rules: TransformRules<U, Context>, context: Context) => {
  let cache: WeakMap<Schema.SchemaCtor, U> = context?.[Cache] ?? new WeakMap<Schema.SchemaCtor, U>()

  let finalContext = {
    ...context,
    [Cache]: cache,
  }

  let transformer = <T extends Schema.SchemaCtor>(SchemaCtor: T): U => {
    let Ctor: new () => Schema.Schema

    if (SchemaCtor === Number) {
      Ctor = Schema.Number
    } else if (SchemaCtor === String) {
      Ctor = Schema.String
    } else if (SchemaCtor === Boolean) {
      Ctor = Schema.Boolean
    } else {
      Ctor = SchemaCtor as new () => Schema.Schema
    }

    let result = cache.get(Ctor)

    if (result) {
      return result
    }

    let schema = new Ctor()

    for (let rule of rules) {
      if (rule.test(schema)) {
        let result = rule.transform(finalContext, rules)(schema)
        cache.set(Ctor, result)
        return result
      }
    }

    throw new Error(`No Rule Found for Schema: ${SchemaCtor}`)
  }

  return transformer
}

// validator

export type SchemaValidationError = {
  path?: (string | number)[]
  message: string
}

export type ValidationResult<T = any> = Result<T, SchemaValidationError>

export type Validator<T = any> = (input: unknown) => ValidationResult<T>

export const SchemaErr = (message: string, path?: SchemaValidationError['path']): Err<SchemaValidationError> => {
  return Err({
    path,
    message,
  })
}

export type ValidatorRule<T extends Schema.Schema, Context extends {}> = TransformRule<
  T,
  Validator<Schema.TypeOf<T>>,
  Context & ValidatorContext
>

export type ValidatorRules<Context extends {}> = Array<ValidatorRule<any, Context>>

export const createValidatorRule = <T extends Schema.Schema, Context = {}>(rule: ValidatorRule<T, Context>) => {
  return rule
}

export const createValidatorByRule = <T extends Schema.SchemaCtor, Context = {}>(
  SchemaCtor: T,
  rules: ValidatorRules<Context>,
  context: Context,
) => {
  let validator: Validator<Schema.TypeOf<T>> | undefined

  return (input: unknown) => {
    if (validator) {
      return validator(input)
    }
    validator = createTransformer<Validator<Schema.TypeOf<T>>, Context>(
      (rules as unknown) as TransformRules<Validator<Schema.TypeOf<T>>, Context>,
      context,
    )(SchemaCtor)
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

export const createValidator = <T extends Schema.SchemaCtor>(SchemaCtor: T, context?: ValidatorContext) => {
  return createValidatorByRule(
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
  return createValidator(SchemaCtor, { visitor: NonStrictValidatorVisitor })
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

const StringValidatorRule = createValidatorRule<Schema.String>({
  test: (schema) => {
    return schema instanceof Schema.String
  },
  transform: (context) => () => {
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
})

const NumberValidatorRule = createValidatorRule<Schema.Number>({
  test: (schema) => {
    return schema instanceof Schema.Number
  },
  transform: (context) => () => {
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
})

const IntValidatorRule = createValidatorRule<Schema.Int>({
  test: (schema) => {
    return schema instanceof Schema.Int
  },
  transform: (context, rules) => () => {
    let handleInt = context.visitor?.Int
    let validateNumber = createValidatorByRule(Schema.Number, rules, context)

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
})

const FloatValidatorRule = createValidatorRule<Schema.Float>({
  test: (schema) => {
    return schema instanceof Schema.Float
  },
  transform: (context, rules) => () => {
    let handleFloat = context.visitor?.Float
    let validateNumber = createValidatorByRule(Schema.Number, rules, context)

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
})

const IDValidatorRule = createValidatorRule<Schema.ID>({
  test: (schema) => {
    return schema instanceof Schema.ID
  },
  transform: (context, rules) => () => {
    let handleID = context?.visitor?.ID
    let validateString = createValidatorByRule(Schema.String, rules, context)

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
            return SchemaErr(`ID can't be empty. input: ${input}`)
          }
          return Ok(value)
        }
      }

      return SchemaErr(`${input} is not an ID`)
    }
  },
})

const BooleanValidatorRule = createValidatorRule<Schema.Boolean>({
  test: (schema) => {
    return schema instanceof Schema.Boolean
  },
  transform: (context) => () => {
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
})

const LiteralValidatorRule = createValidatorRule<Schema.LiteralType>({
  test: (schema) => {
    return schema instanceof Schema.LiteralType
  },
  transform: () => (schema) => {
    let value = schema.value
    return (input) => {
      if (input === value) {
        return Ok(input as Schema.Literals)
      }
      return SchemaErr(`${input} is not a literal ${value}`)
    }
  },
})

const ListValidatorRule = createValidatorRule<Schema.ListType>({
  test: (schema) => {
    return schema instanceof Schema.ListType
  },
  transform: (context, rules) => <T extends Schema.ListType>(schema: T) => {
    let validateItem = createValidatorByRule(schema.Item, rules, context)

    return (input) => {
      if (!Array.isArray(input)) {
        return SchemaErr(`${input} is not a list`)
      }

      let results = [] as Schema.TypeOf<T>

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
})

type FieldsValidators<T> = {
  [key in keyof T]: Validator<T[key]>
}

const createFieldsValidators = <T extends Schema.FieldDescriptors, Context extends ValidatorContext & TransformCache>(
  descriptors: T,
  rules: ValidatorRules<Context>,
  context: Context,
): FieldsValidators<Schema.TypeOfFieldDescriptors<T>> => {
  let fieldsValidators = {}

  for (let [key, field] of Object.entries(descriptors)) {
    if (!Schema.isFieldDescriptor(field)) {
      if (Schema.isFieldDescriptors(field)) {
        fieldsValidators[key] = createValidatorByRule(Schema.Struct(field), rules, context)
      }
      continue
    }

    if (typeof field === 'function') {
      fieldsValidators[key] = createValidatorByRule(field, rules, context)
    } else {
      fieldsValidators[key] = createValidatorByRule(field[Schema.Type], rules, context)
    }
  }

  return fieldsValidators as FieldsValidators<Schema.TypeOfFieldDescriptors<T>>
}

const ObjectValidatorRule = createValidatorRule<Schema.ObjectType | Schema.StructType>({
  test: (schema) => {
    return schema instanceof Schema.ObjectType || schema instanceof Schema.StructType
  },
  transform: (context, rules) => <T extends Schema.ObjectType | Schema.StructType>(schema: T) => {
    let descriptors = (schema instanceof Schema.StructType ? schema.descriptors : schema) as Schema.FieldDescriptors
    let fieldsValidators = createFieldsValidators(descriptors, rules, context)

    return (input) => {
      if (typeof input !== 'object' || !input) {
        return SchemaErr(`${input} is not an object`)
      }

      let results = {} as Schema.TypeOf<T>

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
})

const RecordValidatorRule = createValidatorRule<Schema.RecordType>({
  test: (schema) => {
    return schema instanceof Schema.RecordType
  },
  transform: (context, rules) => <T extends Schema.RecordType>(schema: T) => {
    let validateItem = createValidatorByRule(schema.Item, rules, context)

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

      return Ok(results as Schema.TypeOf<T>)
    }
  },
})

const NullableValidatorRule = createValidatorRule<Schema.NullableType>({
  test: (schema) => {
    return schema instanceof Schema.NullableType
  },
  transform: (context, rules) => <T extends Schema.NullableType>(schema: T) => {
    let validateItem = createValidatorByRule(schema.Item, rules, context) as Validator<Schema.TypeOf<T>>

    return (input) => {
      if (input === null || input === undefined) {
        return Ok(input as Schema.TypeOf<T>)
      }
      return validateItem(input)
    }
  },
})

const UnionValidatorRule = createValidatorRule<Schema.UnionType>({
  test: (schema) => {
    return schema instanceof Schema.UnionType
  },
  transform: (context, rules) => <T extends Schema.UnionType>(schema: T) => {
    let itemsValidators = schema.Items.map((Item) => createValidatorByRule(Item, rules, context))

    return (input) => {
      let messages: string[] = []

      for (let i = 0; i < itemsValidators.length; i++) {
        let validateItem = itemsValidators[i]
        let result = validateItem(input)
        if (result.isOk) return result as ValidationResult<Schema.TypeOf<T>>
        messages.push(result.value.message)
      }

      return SchemaErr(`Matched unions failed: \n${messages.join('\n&\n')}`)
    }
  },
})

const IntersectValidatorRule = createValidatorRule<Schema.IntersectType>({
  test: (schema) => {
    return schema instanceof Schema.IntersectType
  },
  transform: (context, rules) => <T extends Schema.IntersectType>(schema: T) => {
    let itemsValidators = schema.Items.map((Item) => createValidatorByRule(Item, rules, context))

    return (input) => {
      let results = {} as Schema.TypeOf<T>

      for (let i = 0; i < itemsValidators.length; i++) {
        let validateItem = itemsValidators[i]
        let result = validateItem(input)
        if (result.isErr) return result
        Object.assign(results, result.value)
      }

      return Ok(results)
    }
  },
})

const JsonValidatorRule = createValidatorRule<Schema.Json>({
  test: (schema) => {
    return schema instanceof Schema.Json
  },
  transform: (context, rules) => (schema) => {
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

    return validateJson
  },
})

const AnyValidatorRule = createValidatorRule<Schema.Any>({
  test: (schema) => {
    return schema instanceof Schema.Any
  },
  transform: (context, rules) => (schema) => {
    return (input) => Ok(input)
  },
})
