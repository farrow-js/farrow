import { Int, Type } from 'farrow-schema'
import { Api, isApi, getContentType, getTypeDescription, getTypeDeprecated } from '../api'
import { toJSON } from '../toJSON'

describe('toJSON', () => {
  it('work correctly', () => {
    let incre = Api(
      {
        input: Number,
        output: Number,
      },
      (input) => {
        return input + 1
      },
    )

    let decre = Api(
      {
        input: Number,
        output: Number,
      },
      (input) => {
        return input - 1
      },
    )

    let entries = {
      incre,
      decre,
    }

    let result = toJSON(entries)

    expect(result).toEqual({
      protocol: 'Farrow-API',
      types: {
        '0': {
          type: 'Number',
        },
      },
      entries: {
        type: 'Entries',
        entries: {
          incre: {
            type: 'Api',
            input: {
              typeId: 0,
              $ref: '#/types/0',
            },
            output: {
              typeId: 0,
              $ref: '#/types/0',
            },
          },
          decre: {
            type: 'Api',
            input: {
              typeId: 0,
              $ref: '#/types/0',
            },
            output: {
              typeId: 0,
              $ref: '#/types/0',
            },
          },
        },
      },
    })
  })
})
