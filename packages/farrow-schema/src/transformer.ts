import * as Schema from './schema'

const Cache = Symbol('transformer-cache')

type Cache = typeof Cache

export type TransformContext<Context extends {}, Output = any> = Context & {
  rules?: TransformRules<Output, Context>
}

export type TransformRule<T extends Schema.Schema, Output, Context extends {}> = {
  test(schema: Schema.Schema): boolean
  transform(schema: T, context: TransformContext<Context>): Output
}

export type TransformRules<Output, Context extends {}> = {
  [key: string]: TransformRule<Schema.Schema, Output, Context>
}

export type TransformCache<T = any> = {
  [Cache]?: WeakMap<Schema.SchemaCtor, T>
}

const getCache = <T>(context: TransformCache<T>): WeakMap<Schema.SchemaCtor, T> => {
  return (context[Cache] = context[Cache] ?? new WeakMap())
}

export const createTransformer = <Output, Context extends {}>(
  context: TransformContext<Context, Output> & TransformCache<Output>,
) => {
  let cache = getCache(context)

  let values = Object.values(context.rules ?? {})

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

    for (let rule of values) {
      if (rule.test(schema)) {
        let result = rule.transform(schema, context)

        cache.set(Ctor, result)

        return result
      }
    }

    throw new Error(`No Rule Found for Schema: ${SchemaCtor}`)
  }

  return transformer
}
