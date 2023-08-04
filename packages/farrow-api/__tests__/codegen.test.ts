import { Api } from '../src/api'
import { toJSON } from '../src/toJSON'
import { codegen } from '../src/codegen'
import {
  Any,
  Float,
  ID,
  Int,
  Intersect,
  Json,
  List,
  Literal,
  Nullable,
  ObjectType,
  Record,
  Struct,
  Type,
  Union,
  Unknown,
  Date,
  Tuple,
  Optional,
} from 'farrow-schema'

const NamedStruct = Struct({
  named: String,
  nest: {
    a: Int,
    nest: {
      b: Float,
    },
  },
})

NamedStruct.displayName = 'NamedStruct'

const NamedUnion = Union(Int, String, Float, {
  named: String,
  nest: {
    a: Int,
    nest: {
      b: Float,
    },
  },
})

NamedUnion.displayName = 'NamedUnion'

const NamedIntersect = Intersect(
  {
    a: Int,
  },
  {
    b: Float,
  },
  {
    c: Number,
  },
  {
    named: String,
    nest: {
      a: Int,
      nest: {
        b: Float,
      },
    },
  },
)

NamedIntersect.displayName = 'NamedIntersect'

const NamedTuple = Tuple(
  { a: Int },
  { b: Float },
  { c: Number },
  {
    named: String,
    nest: {
      a: Int,
      nest: {
        b: Float,
      },
    },
  },
)

NamedTuple.displayName = 'NamedTuple'


class Collection extends ObjectType {
  namedStruct = NamedStruct
  namedUnion = NamedUnion
  namedIntersect = NamedIntersect
  namedTuple = NamedTuple
  number = Number
  int = Int
  float = Float
  string = String
  boolean = Boolean
  id = ID
  date = Date
  nest = Nullable(Collection)
  optional?= Optional(String)
  list = List(Collection)
  struct = Struct({
    named: String,
    nest: {
      a: Int,
      nest: {
        b: Float,
      },
    },
  })
  union = Union(Int, String, Boolean)
  intersect = Intersect(
    {
      a: Int,
    },
    {
      b: Float,
    },
    {
      c: Number,
    },
  )
  any = Any
  unknown = Unknown
  json = Json
  literal = Union(Literal(1), Literal('1'), Literal(false), Literal(null))
  record = Record(Collection)

  describable = {
    description: 'test description',
    deprecated: 'test deprecated',
    [Type]: Int,
  }
}


class A extends ObjectType {
  a = String
}

A.namespace = 'TestNamespace'

class B extends ObjectType {
  b = String
}

B.namespace = 'TestNamespace'

const NamedRecord = Record(Collection)

NamedRecord.displayName = 'NamedRecord'

const methodA = Api(
  {
    input: Struct({
      named: String,
      testNamespace: {
        a: A,
        b: B,
        namedRecord: NamedRecord,
      },
      nest: {
        a: Int,
        nest: {
          b: Float,
        },
      },
    }),
    output: Collection,
  },
  () => {
    throw new Error('No Implementation')
  },
)

const methodB = Api(
  {
    input: Collection,
    output: Struct({
      named: String,
      nest: {
        a: Int,
        nest: {
          b: Float,
        },
      },
    }),
  },
  () => {
    throw new Error('No Implementation')
  },
)

const entries = {
  methodA,
  methodB,
  nest: {
    methodA,
    nest: {
      methodB,
    },
  },
}

describe('generateApi', () => {
  it('can disable emitting api-client', async () => {
    const formatResult = toJSON(entries)

    const source = codegen(formatResult, {})

    expect(source).toMatchSnapshot()
  })

  it('can attach header and footer when codegen', async () => {
    const formatResult = toJSON(entries)

    const source = codegen(formatResult, {
      header: `// header`,
      footer: `// footer`,
    })

    expect(source.includes('// header')).toBe(true)
    expect(source.includes('// footer')).toBe(true)
  })
})
