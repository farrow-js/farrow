import * as Schema from './schema'

const Cache = Symbol('transform-cache')

type Cache = typeof Cache

export const PASS = Symbol('pass')

export type PASS = typeof PASS

export type TransformRule<T extends Schema.Schema, Output, Context extends {}> = {
  test(schema: Schema.Schema): boolean
  transform(schema: T, context: Context, rules: TransformRules<any, Context>): Output
}

export type TransformRules<Output, Context extends {}> = Array<TransformRule<Schema.Schema, Output, Context>>

export type TransfromCache<T = any> = {
  [Cache]?: WeakMap<Schema.SchemaCtor, T>
}

const getCache = <T>(context: TransfromCache<T>): WeakMap<Schema.SchemaCtor, T> => {
  return (context[Cache] = context[Cache] ?? new WeakMap())
}

export const createTransformer = <Output, Context extends {}>(
  rules: TransformRules<Output, Context>,
  context: Context & TransfromCache<Output>,
) => {
  let cache = getCache(context)

  let transformer = <SC extends Schema.SchemaCtor>(SchemaCtor: SC): Output => {
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
        let result = rule.transform(schema, context, rules)

        cache.set(Ctor, result)

        return result
      }
    }

    throw new Error(`No Rule Found for Schema: ${SchemaCtor}`)
  }

  return transformer
}
