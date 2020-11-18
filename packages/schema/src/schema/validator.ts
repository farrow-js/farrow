import * as Schema from './schema'
import { Err, Ok, Result } from '../types'

export type SchemaValidationError = {
  path?: (string | number)[]
  message: string
}

export type ValidationResult<T = any> = Result<T, SchemaValidationError>

export type Validator<T = any> = (input: any) => ValidationResult<T>

const SchemaErr = (message: string, path?: SchemaValidationError['path']): ValidationResult => {
  return Err({
    path,
    message,
  })
}

export const createValidator = <T extends Schema.ValidSchema>(
  TargetSchema: Schema.ValidSchemaCtor<T>,
): Validator<Schema.TypeOf<T>> => {
  type Validate = Validator<Schema.TypeOf<T>>

  let schema = new TargetSchema()

  if (schema instanceof Number) {
    return (validateNumber as unknown) as Validate
  }

  if (schema instanceof String) {
    return (validateString as unknown) as Validate
  }

  if (schema instanceof Boolean) {
    return (validateBoolean as unknown) as Validate
  }

  if (schema instanceof Schema.Int) {
    return (validateInt as unknown) as Validate
  }

  if (schema instanceof Schema.Float) {
    return (validateFloat as unknown) as Validate
  }

  if (schema instanceof Schema.Json) {
    return (validateJson as unknown) as Validate
  }

  if (schema instanceof Schema.Any) {
    return (validateAny as unknown) as Validate
  }

  if (schema instanceof Schema.LiteralType) {
    return (createLiteralValidator(schema) as unknown) as Validate
  }

  if (schema instanceof Schema.ListType) {
    return (createListValidator(schema) as unknown) as Validate
  }

  if (schema instanceof Schema.ObjectType) {
    return (createObjectValidator(schema) as unknown) as Validate
  }

  if (schema instanceof Schema.NullableType) {
    // @ts-ignore
    return (createNullableValidator(schema) as unknown) as Validate
  }

  if (schema instanceof Schema.UnionType) {
    return (createUnionValidator(schema) as unknown) as Validate
  }

  if (schema instanceof Schema.IntersectType) {
    return (createIntersectValidator(schema) as unknown) as Validate
  }

  if (schema instanceof Schema.RecordType) {
    return (createRecordValidator(schema) as unknown) as Validate
  }

  throw new Error(`Unsupported Schema: ${TargetSchema}`)
}

const validateString: Validator<string> = (input) => {
  if (typeof input === 'string') {
    return Ok(input)
  }
  return SchemaErr(`${input} is not a string`)
}

const validateNumber: Validator<number> = (input) => {
  if (typeof input === 'number') {
    return Ok(input)
  }
  return SchemaErr(`${input} is not a number`)
}

const validateInt: Validator<number> = (input) => {
  let result = validateNumber(input)

  if (result.isErr) {
    return result
  }

  if (Number.isInteger(result.value)) {
    return result
  }

  return SchemaErr(`${input} is not an integer`)
}

const validateFloat = validateNumber

const validateBoolean: Validator<boolean> = (input) => {
  if (typeof input === 'boolean') {
    return Ok(input)
  }
  return SchemaErr(`${input} is not a boolean`)
}

const createLiteralValidator = <T extends Schema.LiteralType>({ value }: T): Validator<Schema.TypeOf<T>> => {
  return (input) => {
    if (input === value) {
      return Ok(input)
    }
    return SchemaErr(`${input} is not a literal ${value}`)
  }
}

const createListValidator = <T extends Schema.ListType>(listSchema: T): Validator<Schema.TypeOf<T>> => {
  // @ts-ignore
  let validateItem = createValidator(listSchema.Item)

  return (input) => {
    if (!Array.isArray(input)) {
      return SchemaErr(`${input} is not a list`)
    }

    let results = [] as any[]

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

const createFieldsValidators = <T extends Schema.ObjectType>(object: T): FieldsValidators<Schema.TypeOf<T>> => {
  let fieldsValidators = {} as FieldsValidators<Schema.TypeOf<T>>

  for (let [key, field] of Object.entries(object)) {
    if (!Schema.isSchemaDescriptor(field)) {
      continue
    }

    if (typeof field === 'function') {
      fieldsValidators[key] = createValidator(field)
    } else {
      fieldsValidators[key] = createValidator(field.type)
    }
  }

  return fieldsValidators
}

const createObjectValidator = <T extends Schema.ObjectType>(objectSchema: T): Validator<Schema.TypeOf<T>> => {
  let fieldsValidators = createFieldsValidators(objectSchema)

  return (input) => {
    let results = {} as Schema.TypeOf<T>

    if (!input || typeof input !== 'object') {
      return SchemaErr(`${input} is not an object`)
    }

    for (let key in fieldsValidators) {
      // @ts-ignore
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

const createRecordValidator = <T extends Schema.RecordType>(recordSchema: T): Validator<Schema.TypeOf<T>> => {
  let validateItem = createValidator(recordSchema.Item)

  return (input) => {
    let results = {}

    if (!input || typeof input !== 'object') {
      return SchemaErr(`${input} is not an object`)
    }

    for (let [key, value] of Object.entries(input)) {
      let result = validateItem(value)
      if (result.isErr) {
        return SchemaErr(result.value.message, [key, ...(result.value.path ?? [])])
      }

      results[key] = result.value
    }

    return Ok(results as Schema.TypeOf<T>)
  }
}

const createNullableValidator = <T extends Schema.NullableType>(nullableSchema: T): Validator<Schema.TypeOf<T>> => {
  let validateItem = createValidator(nullableSchema.Item)

  return (input) => {
    if (input === null || input === undefined) {
      return Ok(input)
    }
    return validateItem(input)
  }
}

const createUnionValidator = <T extends Schema.UnionType>(unionSchema: T): Validator<Schema.TypeOf<T>> => {
  let itemsValidators = unionSchema.Items.map(createValidator)

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
}

const createIntersectValidator = <T extends Schema.IntersectType>(intersectSchema: T): Validator<Schema.TypeOf<T>> => {
  let itemsValidators = intersectSchema.Items.map(createValidator)

  return (input) => {
    let results = ({} as unknown) as Schema.TypeOf<T>

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

  if (typeof input === 'object') {
    for (let value of Object.values(input)) {
      let result = validateJson(value)
      if (result.isErr) return result
    }

    return Ok(input)
  }

  throw new Error(`${input} is not a valid json`)
}

const validateAny: Validator<any> = (input) => {
  return Ok(input)
}

const { ObjectType, List } = Schema

class User extends ObjectType {
  id = {
    type: String,
    description: 'user id',
  }

  orders = {
    type: List(Order),
    description: `user's orders`,
  }

  friends = {
    type: List(User),
    description: `friends of user`,
  }
}

class Order extends ObjectType {
  id = {
    type: String,
    description: 'order id',
  }

  user = {
    type: User,
    description: `order's owner`,
  }
}

class Query extends ObjectType {
  getUserInfo = {
    args: {},
    type: User,
    description: 'get user info',
  }

  getOrders = {
    type: Order,
    description: `get user's order list`,
  }
}

type QueryType = Schema.TypeOf<Query>

let validate = createValidator(Query)
