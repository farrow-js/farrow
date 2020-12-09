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
  FunctionFieldConfig
} from './graphql'


export const isValueFieldConfig = (input: any): input is ValueFieldConfig => {
  return input?.type instanceof Type
}

export const isFunctionFieldConfig = (input: any): input is

export type SchemaConfig = {
  query: ObjectType,
  mutation?: ObjectType
}

export const buildSchema = (config: SchemaConfig): string => {
  let schemaMap = {} as {
    [key: string]: {
      definition?: string
    }
  }

  let build = (type: Type) => {
    if (!schemaMap.hasOwnProperty(type.__typename)) {
      schemaMap[type.__typename] = {}
    }

    if (type instanceof ObjectType) {
      let fields = [] as string[]

      for (let key in type) {
        let field = type[key]

        if (field instanceof)

      }

    }
    

  }

  return 'schema'
}