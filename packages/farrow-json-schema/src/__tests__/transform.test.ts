import { Int, Type } from 'farrow-schema'
import { Api, ApiEntries } from 'farrow-api'
import { toJSON } from 'farrow-api/dist/toJSON'
import { transform, transformResult } from '../'

describe('transform', () => {
  it('schema', () => {
    const definition = {
      input: {
        [Type]: Int,
      },
      output: {
        [Type]: Int,
      },
    }

    const jsonSchema = transform(definition.input)

    expect(jsonSchema).toMatchObject({
      $id: '/farrow/schema',
      $ref: '#/definitions/0',
      definitions: {
        0: {
          $id: '0',
          type: 'integer',
        },
      },
    })
  })

  it('api', () => {
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

    const formatResult = toJSON(entries)

    if ('incre' in formatResult.entries.entries) {
      const incre = formatResult.entries.entries['incre']
      if (incre.type === 'Api') {
        const inputJSONSchema = transformResult({ typeId: incre.input.typeId, types: formatResult.types })
        // eslint-disable-next-line jest/no-conditional-expect
        expect(inputJSONSchema).toMatchObject({
          $id: '/farrow/schema',
          $ref: '#/definitions/0',
          definitions: {
            0: {
              $id: '0',
              type: 'integer',
            },
          },
        })

        const outputJSONSchema = transformResult({ typeId: incre.output.typeId, types: formatResult.types })
        // eslint-disable-next-line jest/no-conditional-expect
        expect(outputJSONSchema).toMatchObject({
          $id: '/farrow/schema',
          $ref: '#/definitions/0',
          definitions: {
            0: {
              $id: '0',
              type: 'integer',
            },
          },
        })
      }
    }
  })
})
