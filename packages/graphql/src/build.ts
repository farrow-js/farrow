import * as GraphQL from 'graphql'

import {
  ObjectType,
  InputObjectType,
  UnionType,
  ListType,
  NullableType,
  EnumType,
  InterfaceType,
  ScalarType,
  Type,
  Int,
  Float,
  String,
  Boolean,
  ID,
  ValueFieldConfig,
  FunctionFieldConfig,
  ArgumentConfigMap,
  OutputType,
  InputType,
  InputFieldConfig,
  InternalScalarType,
} from './graphql'

export const isValueFieldConfig = (input: any): input is ValueFieldConfig => {
  return input?.type?.prototype instanceof Type && typeof input?.args !== 'object'
}

export const isFunctionFieldConfig = (input: any): input is FunctionFieldConfig => {
  return input?.type?.prototype instanceof Type && !!input?.args && typeof input.args === 'object'
}

export const isInputFieldConfig = (input: any): input is InputFieldConfig => {
  return input?.type?.prototype instanceof Type && typeof input?.args !== 'object'
}

export type SchemaConfig = {
  Query: new () => ObjectType
  Mutation?: new () => ObjectType
}

export const build = (config: SchemaConfig) => {
  let outputMap = {} as {
    [key: string]: GraphQL.GraphQLOutputType
  }

  let inputMap = {} as {
    [key: string]: GraphQL.GraphQLInputType
  }

  let buildScalar = (type: InternalScalarType): GraphQL.GraphQLScalarType => {
    if (type instanceof String) {
      return GraphQL.GraphQLString
    }

    if (type instanceof Float) {
      return GraphQL.GraphQLFloat
    }

    if (type instanceof Int) {
      return GraphQL.GraphQLInt
    }

    if (type instanceof Boolean) {
      return GraphQL.GraphQLBoolean
    }

    if (type instanceof ID) {
      return GraphQL.GraphQLID
    }

    if (type instanceof ScalarType) {
      // scalr type is both output type and input type
      if (inputMap.hasOwnProperty(type.name)) {
        return inputMap[type.name] as GraphQL.GraphQLScalarType
      }

      if (outputMap.hasOwnProperty(type.name)) {
        return outputMap[type.name] as GraphQL.GraphQLScalarType
      }

      let scalar = new GraphQL.GraphQLScalarType({
        name: type.name,
        description: type.description,
        serialize: type.serialize,
        parseValue: type.parseValue,
        parseLiteral: type.parseLiteral,
      })

      inputMap[type.name] = scalar
      outputMap[type.name] = scalar

      return scalar
    }

    throw new Error(`Unknown scalar type: ${type}`)
  }

  let buildInterface = (type: InterfaceType): GraphQL.GraphQLInterfaceType => {
    if (outputMap.hasOwnProperty(type.name)) {
      return outputMap[type.name] as GraphQL.GraphQLInterfaceType
    }

    let result = new GraphQL.GraphQLInterfaceType({
      name: type.name,
      description: type.description,
      fields: () => {
        return buildFields(type.fields)
      },
    })

    outputMap[type.name] = result

    return result
  }

  let buildOutputNullable = (type: OutputType): GraphQL.GraphQLOutputType => {
    if (type instanceof NullableType) {
      let Type = type.Type as new () => OutputType
      return buildOutput(new Type())
    }
    return new GraphQL.GraphQLNonNull(buildOutput(type))
  }

  let buildFields = (fields: ObjectType['fields']): GraphQL.GraphQLFieldConfigMap<any, any> => {
    let result = {} as GraphQL.GraphQLFieldConfigMap<any, any>

    for (let key in fields) {
      let field = fields[key]

      if (typeof field === 'function') {
        result[key] = {
          type: buildOutputNullable(new field()),
        }
      } else if (isFunctionFieldConfig(field)) {
        result[key] = {
          args: buildArgs(field.args),
          type: buildOutputNullable(new field.type()),
          description: field.description,
          deprecationReason: field.deprecated,
        }
      } else if (isValueFieldConfig(field)) {
        result[key] = {
          type: buildOutputNullable(new field.type()),
          description: field.description,
          deprecationReason: field.deprecated,
        }
      } else {
        throw new Error(`Unknown object field, key: ${key}, value: ${field}`)
      }
    }

    return result
  }

  let buildArgs = (args: ArgumentConfigMap): GraphQL.GraphQLFieldConfigArgumentMap => {
    let result = {} as GraphQL.GraphQLFieldConfigArgumentMap

    for (let key in args) {
      let arg = args[key]

      result[key] = {
        type: buildInputNullable(new arg.type()),
        description: arg.description,
        deprecationReason: arg.deprecated,
        defaultValue: arg.defaultValue,
      }
    }

    return result
  }

  let buildObject = (type: ObjectType): GraphQL.GraphQLObjectType => {
    if (outputMap.hasOwnProperty(type.name)) {
      return outputMap[type.name] as GraphQL.GraphQLObjectType
    }

    let object = new GraphQL.GraphQLObjectType({
      name: type.name,
      description: type.description,
      interfaces: () => {
        return type.interfaces?.map((Interface) => buildInterface(new Interface()))
      },
      fields: () => {
        return buildFields(type.fields)
      },
    })

    outputMap[type.name] = object

    return object
  }

  let buildEnum = (type: EnumType): GraphQL.GraphQLEnumType => {
    // enum type is both output type and input type
    if (inputMap.hasOwnProperty(type.name)) {
      return inputMap[type.name] as GraphQL.GraphQLEnumType
    }

    if (outputMap.hasOwnProperty(type.name)) {
      return outputMap[type.name] as GraphQL.GraphQLEnumType
    }

    let result = new GraphQL.GraphQLEnumType({
      name: type.name,
      description: type.description,
      values: type.values,
    })

    inputMap[type.name] = result
    outputMap[type.name] = result

    return result
  }

  let buildUnion = (type: UnionType): GraphQL.GraphQLUnionType => {
    if (outputMap.hasOwnProperty(type.name)) {
      return outputMap[type.name] as GraphQL.GraphQLUnionType
    }

    let union = new GraphQL.GraphQLUnionType({
      name: type.name,
      description: type.description,
      types: type.types.map((Type) => {
        return buildObject(new Type())
      }),
      resolveType: type.resolveTypes
        ? (value) => {
            let Type = type.resolveTypes!(value)
            return buildObject(new Type())
          }
        : undefined,
    })

    return union
  }

  let buildInputNullable = (type: InputType): GraphQL.GraphQLInputType => {
    if (type instanceof NullableType) {
      let Type = type.Type as new () => InputType
      return buildInput(new Type())
    }
    return new GraphQL.GraphQLNonNull(buildInput(type))
  }

  let buildInputFields = (fields: InputObjectType['fields']): GraphQL.GraphQLInputFieldConfigMap => {
    let result = {} as GraphQL.GraphQLInputFieldConfigMap

    for (let key in fields) {
      let field = fields[key]

      if (typeof field === 'function') {
        result[key] = {
          type: buildInputNullable(new field()),
        }
      } else if (isInputFieldConfig(field)) {
        result[key] = {
          type: buildInputNullable(new field.type()),
          description: field.description,
          deprecationReason: field.deprecated,
        }
      } else {
        throw new Error(`Unknown input field, key: ${key}, value: ${field}`)
      }
    }

    return result
  }

  let buildInputObject = (type: InputObjectType): GraphQL.GraphQLInputObjectType => {
    let object = new GraphQL.GraphQLInputObjectType({
      name: type.name,
      description: type.description,
      fields: () => {
        return buildInputFields(type.fields)
      },
    })

    inputMap[type.name] = object

    return object
  }

  let buildInput = (type: InputType): GraphQL.GraphQLInputType => {
    if (inputMap.hasOwnProperty(type.name)) {
      return inputMap[type.name]
    }

    if (type instanceof InternalScalarType) {
      return buildScalar(type)
    }

    if (type instanceof InputObjectType) {
      return buildInputObject(type)
    }

    if (type instanceof ListType) {
      let Type = type.Type as new () => InputType
      return new GraphQL.GraphQLList(buildInputNullable(new Type()))
    }

    if (type instanceof EnumType) {
      return buildEnum(type)
    }
    throw new Error(`Unknown input type: ${type.name}\n${type.description ?? ''}`)
  }

  let buildOutput = (type: OutputType): GraphQL.GraphQLOutputType => {
    if (outputMap.hasOwnProperty(type.name)) {
      return outputMap[type.name]
    }

    if (type instanceof InternalScalarType) {
      return buildScalar(type)
    }

    if (type instanceof ObjectType) {
      return buildObject(type)
    }

    if (type instanceof ListType) {
      let Type = type.Type as new () => OutputType
      return new GraphQL.GraphQLList(buildOutputNullable(new Type()))
    }

    if (type instanceof EnumType) {
      return buildEnum(type)
    }

    if (type instanceof UnionType) {
      return buildUnion(type)
    }

    throw new Error(`Unknown output type: ${type.name}\n${type.description ?? ''}`)
  }

  buildOutput(new config.Query())

  if (config.Mutation) {
    buildOutput(new config.Mutation())
  }

  let Query = outputMap['Query']
  let Mutation = outputMap['Mutation']

  if (!Query) {
    throw new Error(`config.Query is not Query Type`)
  }

  if (config.Mutation && !Mutation) {
    throw new Error(`config.Mutation is not Mutation Type`)
  }

  let Schema = new GraphQL.GraphQLSchema({
    query: Query as GraphQL.GraphQLObjectType,
    mutation: Mutation as GraphQL.GraphQLObjectType,
  })

  return Schema
}
