import { Int, ObjectType, Type } from 'farrow-schema'
import { Api } from 'farrow-api'
import { ApiService } from 'farrow-api-server'

class CountState extends ObjectType {
  count = {
    description: 'count of counter',
    [Type]: Int,
  }
}

let count = 0

const getCount = Api(
  {
    input: {},
    output: CountState,
  },
  () => {
    return {
      count,
    }
  },
)

const setCount = Api(
  {
    input: {
      newCount: {
        description: 'new count value',
        [Type]: Int,
      },
    },
    output: CountState,
  },
  (input) => {
    count = input.newCount
    return getCount({})
  },
)

const entries = {
  getCount,
  setCount,
}

export const service = ApiService({
  entries,
})
