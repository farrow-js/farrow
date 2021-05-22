import { Api } from '../api'
import { toJSON } from '../toJSON'

describe('toJSON', () => {
  it('work correctly', () => {
    const incre = Api({
      input: Number,
      output: Number,
    })

    const decre = Api({
      input: Number,
      output: Number,
    })

    const entries = {
      incre,
      decre,
    }

    const result = toJSON(entries)

    expect(result).toEqual({
      protocol: 'Farrow-API',
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Number',
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
