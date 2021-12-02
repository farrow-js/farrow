import { Int, Type } from 'farrow-schema'
import { Api, ApiEntries } from '../src/api'
import { toJSON } from '../src/toJSON'
import { controvertEntries } from '../src/controvert'

describe('controvert', () => {
  it('work', () => {
    const definition = {
      input: {
        [Type]: Int,
      },
      output: {
        [Type]: Int,
      },
    }
    const incre = Api(definition, (input: number): number => {
      return input + 1
    })

    const entries: ApiEntries = {
      incre,
    }

    const newEntries = controvertEntries(toJSON(entries))

    expect('incre' in newEntries).toBeTruthy()
  })
})
