import fs from 'fs/promises'
import { Api } from '../src/api'
import { toJSON } from '../src/toJSON'
import { generateApi } from '../src/generateApi'
import { format } from '../src/prettier'
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
  partial,
} from 'farrow-schema'

const NamedStruct = Struct({
  named: String,
})

NamedStruct.displayName = 'NamedStruct'

const NamedUnion = Union(Int, String, Float)

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
)

NamedIntersect.displayName = 'NamedIntersect'

const NamedTuple = Tuple({ a: Int }, { b: Float }, { c: Number })

NamedTuple.displayName = 'NamedTuple'

const PartialStruct = partial(
  Struct({
    a: Int,
    b: Float,
    c: Boolean,
  }),
)

PartialStruct.displayName = 'PartialStruct'

class Collection extends ObjectType {
  namedStruct = NamedStruct
  namedUnion = NamedUnion
  namedIntersect = NamedIntersect
  namedTuple = NamedTuple
  partialStruct = PartialStruct
  number = Number
  int = Int
  float = Float
  string = String
  boolean = Boolean
  id = ID
  date = Date
  nest = Nullable(Collection)
  list = List(Collection)
  struct = Struct({
    a: Int,
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

const methodA = Api(
  {
    input: Collection,
    output: Collection,
  },
  () => {
    throw new Error('No Implementation')
  },
)

const methodB = Api(
  {
    input: Collection,
    output: Collection,
  },
  () => {
    throw new Error('No Implementation')
  },
)

const entries = {
  methodA,
  methodB,
}

describe('codegen', () => {
  it('can disable emiting api-client', async () => {
    const formatResult = toJSON(entries)

    const source = generateApi(formatResult, {
      emitApiClient: false,
      noCheck: 'just for testing',
    })

    const formatedSource = format(source)

    const expected = await fs.readFile(`${__dirname}/expected/01.ts`)

    expect(formatedSource.replace(/\r|\n/g, '')).toBe(expected.toString().replace(/\r|\n/g, ''))
  })
})
