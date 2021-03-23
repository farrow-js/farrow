import fs from 'fs/promises'
import { Api } from '../api'
import { toJSON } from '../toJSON'
import { codegen } from '../codegen'
import { format } from '../prettier'
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
} from 'farrow-schema'

class Collection extends ObjectType {
  number = Number
  int = Int
  float = Float
  string = String
  boolean = Boolean
  id = ID
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

let methodA = Api(
  {
    input: Collection,
    output: Collection,
  },
  () => {
    throw new Error('No Implementation')
  },
)

let methodB = Api(
  {
    input: Collection,
    output: Collection,
  },
  () => {
    throw new Error('No Implementation')
  },
)

let entries = {
  methodA,
  methodB,
}

describe('codegen', () => {
  it('support codegen', async () => {
    let formatResult = toJSON(entries)

    let source = codegen(formatResult)

    let formatedSource = format(source)

    let expected = await fs.readFile(`${__dirname}/expected/01.ts`)

    expect(formatedSource.replace(/\r|\n/g, '')).toEqual(expected.toString().replace(/\r|\n/g, ''))
  })

  it('can disable emiting api-client', async () => {
    let formatResult = toJSON(entries)

    let source = codegen(formatResult, {
      emitApiClient: false,
    })

    let formatedSource = format(source)

    let expected = await fs.readFile(`${__dirname}/expected/02.ts`)

    expect(formatedSource.replace(/\r|\n/g, '')).toEqual(expected.toString().replace(/\r|\n/g, ''))
  })
})
