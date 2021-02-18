import fs from 'fs/promises'
import { Api } from '../api'
import { toJSON } from '../toJSON'
import { codegen } from '../codegen'
import { format } from '../prettier'
import { ObjectType } from 'farrow-schema'

class Count extends ObjectType {
  count = Number
}

let incre = Api(
  {
    input: Count,
    output: Count,
  },
  (input) => {
    return {
      count: input.count + 1,
    }
  },
)

let decre = Api(
  {
    input: Count,
    output: Count,
  },
  (input) => {
    return {
      count: input.count - 1,
    }
  },
)

let entries = {
  incre,
  decre,
}

describe('codegen', () => {
  it('support codegen', async () => {
    let formatResult = toJSON(entries)

    let source = codegen(formatResult)

    let formatedSource = format(source)

    let expected = await fs.readFile(`${__dirname}/expected/01.ts`)

    expect(formatedSource).toEqual(expected.toString())
  })

  it('can disable emiting api-client', async () => {
    let formatResult = toJSON(entries)

    let source = codegen(formatResult, {
      emitApiClient: false,
    })

    let formatedSource = format(source)

    let expected = await fs.readFile(`${__dirname}/expected/02.ts`)

    expect(formatedSource).toEqual(expected.toString())
  })
})
