import { Int, Type } from 'farrow-schema'
import { Api, isApi, getContentType, getTypeDescription, getTypeDeprecated } from '../src/api'

describe('Api', () => {
  it('supports Typeable', async () => {
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

    expect(isApi(incre)).toEqual(true)
    expect(isApi({})).toEqual(false)
    expect(incre.type).toEqual('Api')
    expect(incre.definition === definition).toEqual(true)
    expect(await incre(0)).toEqual(1)
  })

  it('should get type from typeable', () => {
    const TargetType = getContentType({
      [Type]: Int,
    })

    expect(TargetType === Int).toBe(true)
  })

  it('should get type description', () => {
    const description = getTypeDescription({
      [Type]: Int,
      description: 'test',
    })

    expect(description).toEqual('test')
  })

  it('should get type deprecated', () => {
    const deprecated = getTypeDeprecated({
      [Type]: Int,
      description: 'test',
      deprecated: 'test deprecated',
    })

    expect(deprecated).toEqual('test deprecated')
  })
})
