import * as Schema from './schema'
import { Err, Ok, Result } from './result'
import { TypeOf, TypeOfFieldDescriptors, Type } from './schema'

export * from './result'

export type SchemaValidationError = {
  path?: (string | number)[]
  message: string
}

export type ValidationResult<T = any> = Result<T, SchemaValidationError>

export type Validator<T = any> = (input: unknown) => ValidationResult<T>

const SchemaErr = (message: string, path?: SchemaValidationError['path']): Err<SchemaValidationError> => {
  return Err({
    path,
    message,
  })
}

type ValidatorWeakMap = WeakMap<Schema.SchemaCtor, Validator>

export type ValidatorOptions = {
  visitor?: {
    Number?: (input: any) => number | void
    Int?: (input: any) => number | void
    Float?: (input: any) => number | void
    String?: (input: any) => string | void
    Boolean?: (input: any) => boolean | void
    ID?: (input: any) => string | void
  }
  validatorWeakMap?: ValidatorWeakMap
}

export const NonStrictValidatorVisitor: ValidatorOptions['visitor'] = {
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

export const createNonStrictValidator = <T extends Schema.SchemaCtor>(TargetSchema: T, options?: ValidatorOptions) => {
  return createValidator(TargetSchema, {
    ...options,
    visitor: NonStrictValidatorVisitor,
  })
}

export const createValidator = <T extends Schema.SchemaCtor>(
  TargetSchema: T,
  options?: ValidatorOptions,
): Validator<TypeOf<T>> => {
  // create weak map to cache validators
  if (!options || !options.validatorWeakMap) {
    options = {
      ...options,
      validatorWeakMap: new WeakMap(),
    }
  }

  let validatorWeakMap = options.validatorWeakMap

  if (validatorWeakMap?.has(TargetSchema)) {
    return validatorWeakMap.get(TargetSchema) as Validator<TypeOf<T>>
  }

  let validator: Validator<TypeOf<T>> | undefined

  let lazyValidator: Validator<TypeOf<T>> = (input) => {
    if (validator) {
      return validator(input)
    }

    validator = createValidatorIfNeeded(TargetSchema, options)

    return validator(input)
  }

  validatorWeakMap?.set(TargetSchema, lazyValidator)

  return lazyValidator
}

const createValidatorIfNeeded = <T extends Schema.SchemaCtor>(TargetSchema: T, options?: ValidatorOptions) => {
  type Validate = Validator<TypeOf<T>>

  let schema = new TargetSchema()

  if (schema instanceof Number) {
    return createNumberValidator(options) as Validate
  }

  if (schema instanceof String) {
    return createStringValidator(options) as Validate
  }

  if (schema instanceof Boolean) {
    return createBooleanValidator(options) as Validate
  }

  if (schema instanceof Schema.Number) {
    return createNumberValidator(options) as Validate
  }

  if (schema instanceof Schema.String) {
    return createStringValidator(options) as Validate
  }

  if (schema instanceof Schema.Boolean) {
    return createBooleanValidator(options) as Validate
  }

  if (schema instanceof Schema.Int) {
    return createIntValidator(options) as Validate
  }

  if (schema instanceof Schema.Float) {
    return createFloatValidator(options) as Validate
  }

  if (schema instanceof Schema.ID) {
    return createIDValidator(options) as Validate
  }

  if (schema instanceof Schema.Json) {
    return validateJson as Validate
  }

  if (schema instanceof Schema.Any) {
    return validateAny as Validate
  }

  if (schema instanceof Schema.LiteralType) {
    return createLiteralValidator(schema) as Validate
  }

  if (schema instanceof Schema.ListType) {
    return createListValidator(schema, options) as Validate
  }

  if (schema instanceof Schema.ObjectType) {
    return createObjectValidator(schema, options) as Validate
  }

  if (schema instanceof Schema.StructType) {
    return createObjectValidator(schema, options) as Validate
  }

  if (schema instanceof Schema.NullableType) {
    return createNullableValidator(schema, options) as Validate
  }

  if (schema instanceof Schema.UnionType) {
    return createUnionValidator(schema, options) as Validate
  }

  if (schema instanceof Schema.IntersectType) {
    return createIntersectValidator(schema, options) as Validate
  }

  if (schema instanceof Schema.RecordType) {
    return createRecordValidator(schema, options) as Validate
  }

  throw new Error(`Unsupported Schema: ${TargetSchema}`)
}

const createStringValidator = (options?: ValidatorOptions): Validator<string> => {
  let handleString = options?.visitor?.String

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
}
const createNumberValidator = (options?: ValidatorOptions): Validator<number> => {
  let handleNumber = options?.visitor?.Number

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
}

const createIntValidator = (options?: ValidatorOptions): Validator<number> => {
  let handleInt = options?.visitor?.Int
  let validateNumber = createValidator(Schema.Number, options)

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
}

const createFloatValidator = (options?: ValidatorOptions): Validator<number> => {
  let handleFloat = options?.visitor?.Float
  let validateNumber = createValidator(Schema.Number, options)

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
}

const createIDValidator = (options?: ValidatorOptions): Validator<string> => {
  let handleID = options?.visitor?.ID
  let validateString = createValidator(Schema.String, options)

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
}

const createBooleanValidator = (options?: ValidatorOptions): Validator<boolean> => {
  let handleBoolean = options?.visitor?.Boolean

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
}

const createLiteralValidator = <T extends Schema.LiteralType>({ value }: T): Validator<TypeOf<T>> => {
  return (input) => {
    if (input === value) {
      return Ok(input as TypeOf<T>)
    }
    return SchemaErr(`${input} is not a literal ${value}`)
  }
}

const createListValidator = <T extends Schema.ListType>(
  listSchema: T,
  options?: ValidatorOptions,
): Validator<TypeOf<T>> => {
  let validateItem = createValidator(listSchema.Item, options)

  return (input) => {
    if (!Array.isArray(input)) {
      return SchemaErr(`${input} is not a list`)
    }

    let results = [] as TypeOf<T>

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
}

type FieldsValidators<T> = {
  [key in keyof T]: Validator<T[key]>
}

const createFieldsValidators = <T extends Schema.FieldDescriptors>(
  descriptors: T,
  options?: ValidatorOptions,
): FieldsValidators<TypeOfFieldDescriptors<T>> => {
  let fieldsValidators = {}

  for (let [key, field] of Object.entries(descriptors)) {
    if (!Schema.isFieldDescriptor(field)) {
      if (Schema.isFieldDescriptors(field)) {
        fieldsValidators[key] = createValidator(Schema.Struct(field))
      }
      continue
    }

    if (typeof field === 'function') {
      fieldsValidators[key] = createValidator(field, options)
    } else {
      fieldsValidators[key] = createValidator(field[Type], options)
    }
  }

  return fieldsValidators as FieldsValidators<TypeOfFieldDescriptors<T>>
}

const createObjectValidator = <T extends Schema.ObjectType | Schema.StructType>(
  schema: T,
  options?: ValidatorOptions,
): Validator<TypeOf<T>> => {
  let descriptors = (schema instanceof Schema.StructType ? schema.descriptors : schema) as Schema.FieldDescriptors
  let fieldsValidators = createFieldsValidators(descriptors, options)

  return (input) => {
    if (typeof input !== 'object' || !input) {
      return SchemaErr(`${input} is not an object`)
    }

    let results = {} as TypeOf<T>

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
}

const createRecordValidator = <T extends Schema.RecordType>(
  recordSchema: T,
  options?: ValidatorOptions,
): Validator<TypeOf<T>> => {
  let validateItem = createValidator(recordSchema.Item, options)

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

    return Ok(results as TypeOf<T>)
  }
}

const createNullableValidator = <T extends Schema.NullableType>(
  nullableSchema: T,
  options?: ValidatorOptions,
): Validator<TypeOf<T>> => {
  let validateItem = createValidator(nullableSchema.Item, options) as Validator<TypeOf<T>>

  return (input) => {
    if (input === null || input === undefined) {
      return Ok(input as TypeOf<T>)
    }
    return validateItem(input)
  }
}

const createUnionValidator = <T extends Schema.UnionType>(
  unionSchema: T,
  options?: ValidatorOptions,
): Validator<TypeOf<T>> => {
  let itemsValidators = unionSchema.Items.map((Item) => createValidator(Item, options))

  return (input) => {
    let messages: string[] = []

    for (let i = 0; i < itemsValidators.length; i++) {
      let validateItem = itemsValidators[i]
      let result = validateItem(input)
      if (result.isOk) return result as ValidationResult<TypeOf<T>>
      messages.push(result.value.message)
    }

    return SchemaErr(`Matched unions failed: \n${messages.join('\n&\n')}`)
  }
}

const createIntersectValidator = <T extends Schema.IntersectType>(
  intersectSchema: T,
  options?: ValidatorOptions,
): Validator<TypeOf<T>> => {
  let itemsValidators = intersectSchema.Items.map((Item) => createValidator(Item, options))

  return (input) => {
    let results = ({} as unknown) as TypeOf<T>

    for (let i = 0; i < itemsValidators.length; i++) {
      let validateItem = itemsValidators[i]
      let result = validateItem(input)
      if (result.isErr) return result
      Object.assign(results, result.value)
    }

    return Ok(results)
  }
}

const validateJson: Validator<Schema.JsonType> = (input) => {
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

const validateAny: Validator<any> = (input) => {
  return Ok(input)
}
