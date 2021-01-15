import { graphql, Source } from 'graphql'
import {
  DataType,
  Fields,
  Float,
  Nullable,
  ObjectType,
  Prettier,
  ResolverTypeOf,
  typename,
  TypeOf,
  UnionType,
} from './graphql'
import { SchemaConfig, build } from './build'

type ResolverConfig<T extends SchemaConfig> = {
  [key in keyof T]: ResolverTypeOf<T[key]> | (() => ResolverTypeOf<T[key]>)
}

export const createFarrowGraphQL = <T extends SchemaConfig>(schemaConfig: T, resolverConfig: ResolverConfig<T>) => {
  let schema = build(schemaConfig)
  let query = (source: Source | string) => {
    let rootValue = typeof resolverConfig['Query'] === 'function' ? resolverConfig['Query']() : resolverConfig['Query']
    return graphql({
      schema,
      source,
      rootValue,
    })
  }

  let mutation = (source: Source | string) => {
    let MutationResolver = resolverConfig['Mutation']
    // @ts-ignore ignore
    let rootValue = typeof MutationResolver === 'function' ? MutationResolver?.() : MutationResolver
    return graphql({
      schema,
      source,
      rootValue,
    })
  }

  return {
    query,
    mutation,
  }
}

class Point2D extends ObjectType {
  name = typename('Point2D')

  fields = {
    x: {
      type: Float,
    },
    y: {
      type: Float,
    },
  }
}

class Point3D extends ObjectType {
  name = typename('Point3D')

  fields = {
    x: {
      type: Float,
    },
    y: {
      type: Float,
    },
    z: {
      type: Float,
    },
  }
}

class Point extends UnionType {
  name = typename('Point')
  types = [Point2D, Point3D]
}

class Circle extends ObjectType {
  name = typename('Circle')
  fields = {
    origin: {
      type: Point,
      description: 'origin of circle',
    },
    radius: {
      type: Float,
      description: 'radius of circle',
    },
  }
}

Point3D.create({ x: 0, y: 0, z: 0 })

const createCircle = (origin: Prettier<DataType<Point>>, radius: Prettier<DataType<Float>>) => {
  return Circle.create({
    origin: () => {
      if (origin.x < 0) return null
      if ('z' in origin) return Point3D.create(origin)
      return Point2D.create(origin)
    },
    radius,
  })
}

class Query extends ObjectType {
  name = typename('Query')
  fields = Fields({
    getCircle: {
      args: {
        x: {
          type: Float,
        },
        y: {
          type: Float,
        },
        z: {
          type: Nullable(Float),
        },
      },
      type: Circle,
      description: 'get circle by {x, y}',
    },
  })
}

type T0 = ResolverTypeOf<Query>

const QueryResolver = Query.create({
  getCircle(args) {
    console.log('args', args)
    let circle = createCircle(args, Math.random() * 100)
    return circle
  },
})
const gql = String.raw

const test = async () => {
  let farrowGraphQL = createFarrowGraphQL(
    {
      Query,
    },
    {
      Query: QueryResolver,
    },
  )

  let result0 = await farrowGraphQL.query(gql`
    query {
      circle: getCircle(x: 1, y: 2) {
        origin {
          __typename
          ... on Point2D {
            x
            y
          }
          ... on Point3D {
            x
            y
          }
        }
        radius
      }
    }
  `)

  console.log('result', JSON.stringify(result0, null, 2))

  let result1 = await farrowGraphQL.query(gql`
    query {
      circle: getCircle(x: 1, y: 2, z: 3) {
        origin {
          __typename
          ... on Point2D {
            x
            y
          }
          ... on Point3D {
            x
            y
          }
        }
        radius
      }
    }
  `)

  console.log('result', JSON.stringify(result1, null, 2))

  let result2 = await farrowGraphQL.query(gql`
    query {
      circle: getCircle(x: -1, y: 2, z: 3) {
        origin {
          __typename
          ... on Point2D {
            x
            y
          }
          ... on Point3D {
            x
            y
          }
        }
        radius
      }
    }
  `)

  console.log('result', JSON.stringify(result2, null, 2))
}

test().catch((error) => {
  console.log('error', error)
})
