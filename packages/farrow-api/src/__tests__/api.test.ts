import { Int, Type } from 'farrow-schema'
import { Api, isApi, getContentType, getTypeDescription, getTypeDeprecated } from '../api'

describe('Api', () => {
  it('supports Typeable', async () => {
    let definition = {
      input: {
        [Type]: Int,
      },
      output: {
        [Type]: Int,
      },
    }
    let incre = Api(definition, (input) => {
      return input + 1
    })

    expect(isApi(incre)).toEqual(true)
    expect(isApi({})).toEqual(false)
    expect(incre.type).toEqual('Api')
    expect(incre.definition === definition).toEqual(true)
    expect(await incre(0)).toEqual(1)
  })

  it('should get type from typeable', () => {
    let TargetType = getContentType({
      [Type]: Int,
    })

    expect(TargetType === Int).toBe(true)
  })

  it('should get type description', () => {
    let description = getTypeDescription({
      [Type]: Int,
      description: 'test',
    })

    expect(description).toEqual('test')
  })

  it('should get type deprecated', () => {
    let deprecated = getTypeDeprecated({
      [Type]: Int,
      description: 'test',
      deprecated: 'test deprecated',
    })

    expect(deprecated).toEqual('test deprecated')
  })
})
