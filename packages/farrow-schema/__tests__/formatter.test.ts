import {
  Type,
  ObjectType,
  Struct,
  ID,
  Int,
  Float,
  Literal,
  List,
  Union,
  Intersect,
  Nullable,
  Record,
  Json,
  Any,
  Unknown,
  Strict,
  NonStrict,
  ReadOnly,
  ReadOnlyDeep,
  Tuple,
  Optional,
} from '../src/schema'

import { formatSchema } from '../src/formatter'
import { partial, required } from '../src/helper'

describe('Formatter', () => {
  it('supports format Number', () => {
    const result = formatSchema(Number)

    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Number',
        },
      },
    })
  })

  it('support format Int', () => {
    const result = formatSchema(Int)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })
  })

  it('support format Float', () => {
    const result = formatSchema(Float)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
      },
    })
  })

  it('support format String', () => {
    const result = formatSchema(String)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'String',
        },
      },
    })
  })

  it('support format Boolean', () => {
    const result = formatSchema(Boolean)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'boolean',
          valueName: 'Boolean',
        },
      },
    })
  })

  it('support format ID', () => {
    const result = formatSchema(ID)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'ID',
        },
      },
    })
  })

  it('support format Date', () => {
    const result = formatSchema(Date)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'Date',
        },
      },
    })
  })

  it('support format Literal', () => {
    const result0 = formatSchema(Literal(0))
    const result1 = formatSchema(Literal(false))
    const result2 = formatSchema(Literal('abc'))
    const result3 = formatSchema(Literal(null))

    expect(result0).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Literal',
          value: 0,
        },
      },
    })

    expect(result1).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Literal',
          value: false,
        },
      },
    })

    expect(result2).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Literal',
          value: 'abc',
        },
      },
    })

    expect(result3).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Literal',
          value: null,
        },
      },
    })
  })

  it('support format Json', () => {
    const result = formatSchema(Json)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'JsonType',
          valueName: 'Json',
        },
      },
    })
  })

  it('support format Any', () => {
    const result = formatSchema(Any)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'any',
          valueName: 'Any',
        },
      },
    })
  })

  it('support format Unknown', () => {
    const result = formatSchema(Unknown)
    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'unknown',
          valueName: 'Unknown',
        },
      },
    })
  })

  it('support format Record', () => {
    const result = formatSchema(Record(Int))

    expect(result).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'Record',
          valueTypeId: 0,
          $ref: `#/types/0`,
        },
      },
    })
  })

  it('support format Nullable', () => {
    const result = formatSchema(Nullable(Int))

    expect(result).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'Nullable',
          itemTypeId: 0,
          $ref: `#/types/0`,
        },
      },
    })
  })

  it('support format Tuple', () => {
    const result = formatSchema(Tuple(Int, String))

    expect(result).toEqual({
      typeId: 2,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'String',
        },
        '2': {
          type: 'Tuple',
          itemTypes: [
            {
              typeId: 0,
              $ref: '#/types/0',
            },
            {
              typeId: 1,
              $ref: '#/types/1',
            },
          ],
        },
      },
    })
  })

  it('support format List', () => {
    const result = formatSchema(List(Int))

    expect(result).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'List',
          itemTypeId: 0,
          $ref: `#/types/0`,
        },
      },
    })
  })

  it('support format Union', () => {
    const result = formatSchema(Union(Int, Float, Boolean))

    expect(result).toEqual({
      typeId: 3,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
        '2': {
          type: 'Scalar',
          valueType: 'boolean',
          valueName: 'Boolean',
        },

        '3': {
          type: 'Union',
          itemTypes: [
            {
              typeId: 0,
              $ref: '#/types/0',
            },
            {
              typeId: 1,
              $ref: '#/types/1',
            },
            {
              typeId: 2,
              $ref: '#/types/2',
            },
          ],
        },
      },
    })
  })

  it('support format Intersect', () => {
    const result = formatSchema(Intersect(Int, Float, Boolean))

    expect(result).toEqual({
      typeId: 3,
      types: {
        '0': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '1': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
        '2': {
          type: 'Scalar',
          valueType: 'boolean',
          valueName: 'Boolean',
        },
        '3': {
          type: 'Intersect',
          itemTypes: [
            {
              typeId: 0,
              $ref: '#/types/0',
            },
            {
              typeId: 1,
              $ref: '#/types/1',
            },
            {
              typeId: 2,
              $ref: '#/types/2',
            },
          ],
        },
      },
    })
  })

  it('supports format Struct', () => {
    const result = formatSchema(
      Struct({
        a: Int,
        b: Number,
        c: {
          d: Float,
          e: Int,
        },
      }),
    )

    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            a: {
              typeId: 1,
              $ref: '#/types/1',
            },
            b: {
              typeId: 2,
              $ref: '#/types/2',
            },
            c: {
              typeId: 3,
              $ref: '#/types/3',
            },
          },
        },
        '1': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Number',
        },
        '3': {
          type: 'Struct',
          fields: {
            d: {
              typeId: 4,
              $ref: '#/types/4',
            },
            e: {
              typeId: 1,
              $ref: '#/types/1',
            },
          },
        },
        '4': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
      },
    })
  })

  it('support format Object', () => {
    class Test extends ObjectType {
      a = Int
      b = Float
      c = Int
      d = {
        e: Nullable(Test),
      }
      f = List(Test)
    }

    const result = formatSchema(Test)

    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Object',
          name: 'Test',
          fields: {
            a: {
              typeId: 1,
              $ref: '#/types/1',
            },
            b: {
              typeId: 2,
              $ref: '#/types/2',
            },
            c: {
              typeId: 1,
              $ref: '#/types/1',
            },
            d: {
              typeId: 3,
              $ref: '#/types/3',
            },
            f: {
              typeId: 4,
              $ref: '#/types/4',
            },
          },
        },
        '1': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
        '3': {
          type: 'Struct',
          fields: {
            e: {
              typeId: 5,
              $ref: '#/types/5',
            },
          },
        },
        '4': {
          type: 'List',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
        '5': {
          type: 'Nullable',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
      },
    })
  })

  it('supports extended info like description/deprecated', () => {
    class Test extends ObjectType {
      a = {
        description: 'int',
        deprecated: 'use field b',
        [Type]: Int,
      }
      b = {
        description: 'float',
        [Type]: Float,
      }
    }

    const result = formatSchema(Test)

    expect(result).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Object',
          name: 'Test',
          fields: {
            a: {
              typeId: 1,
              description: 'int',
              deprecated: 'use field b',
              $ref: '#/types/1',
            },
            b: {
              typeId: 2,
              description: 'float',
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Float',
        },
      },
    })
  })

  it('supports format Strict/NonStrict/ReadOnly/ReadOnlyDeep', () => {
    const result0 = formatSchema(
      Strict(
        Struct({
          a: Int,
        }),
      ),
    )

    const result1 = formatSchema(
      NonStrict(
        Struct({
          a: Int,
        }),
      ),
    )

    const result2 = formatSchema(
      ReadOnly(
        Struct({
          a: Int,
        }),
      ),
    )

    const result3 = formatSchema(
      ReadOnlyDeep(
        Struct({
          a: Int,
        }),
      ),
    )

    expect(result0).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            a: {
              typeId: 2,
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'Strict',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })

    expect(result1).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            a: {
              typeId: 2,
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'NonStrict',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })

    expect(result2).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            a: {
              typeId: 2,
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'ReadOnly',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })

    expect(result3).toEqual({
      typeId: 1,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            a: {
              typeId: 2,
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'ReadOnlyDeep',
          itemTypeId: 0,
          $ref: '#/types/0',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })
  })

  it('support format partial struct/object', () => {
    class User extends ObjectType {
      name = String
      friends = List(User)
    }

    const Person = Struct({
      name: String,
      age: Int,
    })

    const PartialUser = partial(User)
    const PartialPerson = partial(Person)

    const result0 = formatSchema(PartialUser)
    const result1 = formatSchema(PartialPerson)
    expect(result0).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Object',
          fields: {
            name: {
              typeId: 2,
              $ref: '#/types/2',
            },
            friends: {
              typeId: 5,
              $ref: '#/types/5',
            },
          },
        },
        '1': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'String',
        },
        '2': {
          type: 'Optional',
          itemTypeId: 1,
          $ref: '#/types/1',
        },
        '3': {
          type: 'Object',
          name: 'User',
          fields: {
            name: {
              typeId: 1,
              $ref: '#/types/1',
            },
            friends: {
              typeId: 4,
              $ref: '#/types/4',
            },
          },
        },
        '4': {
          type: 'List',
          itemTypeId: 3,
          $ref: '#/types/3',
        },
        '5': {
          type: 'Optional',
          itemTypeId: 4,
          $ref: '#/types/4',
        },
      },
    })
    expect(result1).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            name: {
              typeId: 2,
              $ref: '#/types/2',
            },
            age: {
              typeId: 4,
              $ref: '#/types/4',
            },
          },
        },
        '1': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'String',
        },
        '2': {
          type: 'Optional',
          itemTypeId: 1,
          $ref: '#/types/1',
        },
        '3': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
        '4': {
          type: 'Optional',
          itemTypeId: 3,
          $ref: '#/types/3',
        },
      },
    })
  })
  it('support format required struct/object', () => {
    class User extends ObjectType {
      name = String
      friends = Optional(List(User))
    }
    const Person = Struct({
      name: Optional(String),
      age: Int,
    })

    const result0 = formatSchema(required(User))
    const result1 = formatSchema(required(Person))
    expect(result0).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Object',
          fields: {
            name: {
              typeId: 1,
              $ref: '#/types/1',
            },
            friends: {
              typeId: 3,
              $ref: '#/types/3',
            },
          },
        },
        '1': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'String',
        },
        '2': {
          type: 'Object',
          name: 'User',
          fields: {
            name: {
              typeId: 1,
              $ref: '#/types/1',
            },
            friends: {
              typeId: 4,
              $ref: '#/types/4',
            },
          },
        },
        '3': {
          type: 'List',
          itemTypeId: 2,
          $ref: '#/types/2',
        },
        '4': {
          type: 'Optional',
          itemTypeId: 3,
          $ref: '#/types/3',
        },
      },
    })
    expect(result1).toEqual({
      typeId: 0,
      types: {
        '0': {
          type: 'Struct',
          fields: {
            name: {
              typeId: 1,
              $ref: '#/types/1',
            },
            age: {
              typeId: 2,
              $ref: '#/types/2',
            },
          },
        },
        '1': {
          type: 'Scalar',
          valueType: 'string',
          valueName: 'String',
        },
        '2': {
          type: 'Scalar',
          valueType: 'number',
          valueName: 'Int',
        },
      },
    })
  })
})
