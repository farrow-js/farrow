import { Api } from 'farrow-api'
import { ApiService } from 'farrow-api-server'
import { ObjectType, Type } from 'farrow-schema'

export class GreetInput extends ObjectType {
  name = {
    description: 'The name for greeting',
    [Type]: String,
  }
}

export class GreetOutput extends ObjectType {
  greet = {
    description: 'The greeting came from server',
    [Type]: String,
  }
}

export const greet = Api(
  {
    description: 'Greeting',
    input: GreetInput,
    output: GreetOutput,
  },
  (input) => {
    const greet = `Hello ${input.name}!`
    return { greet }
  },
)

export const service = ApiService({
  entries: {
    greet,
  },
})
