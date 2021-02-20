import { Api } from '../api'
import { toJSON } from '../toJSON'

describe('toJSON', () => {
  it('work correctly', () => {
    let incre = Api({
      input: Number,
      output: Number,
    })

    let decre = Api({
      input: Number,
      output: Number,
    })

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
