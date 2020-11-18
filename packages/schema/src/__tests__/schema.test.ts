import {
  nullable,
  number,
  string,
  boolean,
  list,
  object,
  literal,
  json,
  record,
  union,
  intersect,
  isTerm,
  isType,
  createType,
  thunk,
  any,
  term,
  Type,
  Term,
  ValidationResult,
  strictNumber,
  strictBoolean,
} from '../schema'

let assertOk = <T>(result: ValidationResult<T>): T => {
  if (result.isOk) return result.value
  throw new Error(result.value.message)
}

describe('Schema', () => {
  it('can distinguish type and term', () => {
    type Result = {
      name: string
      list: boolean[]
    }
    let checkList = [] as Result[]

    let check = (name: string, type: Type, term: Term) => {
      let result: Result = {
        name,
        list: [],
      }

      result.list.push(isType(type))
      result.list.push(isTerm(term))

      result.list.push(isType(term))
      result.list.push(isTerm(type))

      checkList.push(result)
    }

    check('number', number, number(10))
    check('string', string, string('test'))
    check('boolean', boolean, boolean(false))

    let numbers = list(number)

    check('list<number>', numbers, numbers([1, 2, 3]))

    let strings = list(string)

    check('list<string>', strings, strings(['1', '2', '3']))

    let booleans = list(boolean)

    check('list<boolean>', booleans, booleans([false, true, false]))

    let obj = object({
      a: number,
      b: string,
      c: boolean,
    })

    check(
      'object',
      obj,
      obj({
        a: 1,
        b: '2',
        c: false,
      }),
    )

    expect(checkList).toEqual([
      {
        name: 'number',
        list: [true, true, false, false],
      },
      {
        name: 'string',
        list: [true, true, false, false],
      },
      {
        name: 'boolean',
        list: [true, true, false, false],
      },
      {
        name: 'list<number>',
        list: [true, true, false, false],
      },
      {
        name: 'list<string>',
        list: [true, true, false, false],
      },
      {
        name: 'list<boolean>',
        list: [true, true, false, false],
      },
      {
        name: 'object',
        list: [true, true, false, false],
      },
    ])
  })

  it('supports number validation', () => {
    expect(assertOk(number.validate(1))).toBe(1)

    expect(assertOk(number.validate('1'))).toBe(1)

    expect(() => assertOk(number.validate('abc'))).toThrow()

    expect(() => assertOk(number.validate(false))).toThrow()

    expect(() => assertOk(number.validate(Number))).toThrow()

    expect(() => assertOk(number.validate([]))).toThrow()

    expect(() => assertOk(number.validate(null))).toThrow()

    expect(() => assertOk(number.validate({}))).toThrow()
  })

  it('supports string validation', () => {
    expect(assertOk(string.validate(''))).toBe('')
    expect(assertOk(string.validate('123'))).toBe('123')

    expect(() => assertOk(string.validate(123))).toThrow()

    expect(() => assertOk(string.validate(false))).toThrow()

    expect(() => assertOk(string.validate(Number))).toThrow()

    expect(() => assertOk(string.validate([]))).toThrow()

    expect(() => assertOk(string.validate(null))).toThrow()

    expect(() => assertOk(string.validate({}))).toThrow()
  })

  it('supports boolean validation', () => {
    expect(assertOk(boolean.validate(true))).toBe(true)
    expect(assertOk(boolean.validate(false))).toBe(false)

    expect(assertOk(boolean.validate('true'))).toBe(true)
    expect(assertOk(boolean.validate('false'))).toBe(false)

    expect(() => assertOk(boolean.validate(123))).toThrow()

    expect(() => assertOk(boolean.validate('adf'))).toThrow()

    expect(() => assertOk(boolean.validate(Number))).toThrow()

    expect(() => assertOk(boolean.validate([]))).toThrow()

    expect(() => assertOk(boolean.validate(null))).toThrow()

    expect(() => assertOk(boolean.validate({}))).toThrow()
  })

  it('supports nullable validation', () => {
    let maybeNumber = nullable(number)
    let maybeString = nullable(string)
    let maybeBoolean = nullable(boolean)

    expect(assertOk(maybeNumber.validate(null))).toBe(null)
    expect(assertOk(maybeNumber.validate(undefined))).toBe(undefined)
    expect(assertOk(maybeNumber.validate(1))).toBe(1)

    expect(assertOk(maybeString.validate(null))).toBe(null)
    expect(assertOk(maybeString.validate(undefined))).toBe(undefined)
    expect(assertOk(maybeString.validate('1'))).toBe('1')

    expect(assertOk(maybeBoolean.validate(null))).toBe(null)
    expect(assertOk(maybeBoolean.validate(undefined))).toBe(undefined)
    expect(assertOk(maybeBoolean.validate(true))).toBe(true)
    expect(assertOk(maybeBoolean.validate(false))).toBe(false)
  })

  it('supports list validation', () => {
    let numbers = list(number)
    let strings = list(string)
    let booleans = list(boolean)

    expect(assertOk(numbers.validate([1, 2, 3]))).toEqual([1, 2, 3])

    expect(assertOk(numbers.validate(['1', '2', '3']))).toEqual([1, 2, 3])

    expect(() => assertOk(numbers.validate(['a', 'b', 'c']))).toThrow()

    expect(assertOk(strings.validate(['a', 'b', 'c']))).toEqual(['a', 'b', 'c'])

    expect(assertOk(strings.validate(['1', '2', '3']))).toEqual(['1', '2', '3'])

    expect(() => assertOk(strings.validate([1, 2, 3]))).toThrow()

    expect(assertOk(booleans.validate([true, false, true]))).toEqual([true, false, true])

    expect(assertOk(booleans.validate(['true', false, 'true']))).toEqual([true, false, true])

    expect(() => assertOk(booleans.validate([1, 2, 3]))).toThrow()
  })

  it('supports object validation', () => {
    let obj = object({
      a: number,
      b: string,
      c: boolean,
      d: list(number),
      e: nullable(string),
    })

    expect(
      assertOk(
        obj.validate({
          a: 1,
          b: '1',
          c: false,
          d: [1, 2, 3],
          e: null,
        }),
      ),
    ).toEqual({
      a: 1,
      b: '1',
      c: false,
      d: [1, 2, 3],
      e: null,
    })

    expect(
      assertOk(
        obj.validate({
          a: 1,
          b: '1',
          c: false,
          d: [1, 2, 3],
        }),
      ),
    ).toEqual({
      a: 1,
      b: '1',
      c: false,
      d: [1, 2, 3],
    })

    expect(
      assertOk(
        obj.validate({
          a: 1,
          b: '1',
          c: false,
          d: [1, 2, 3],
          e: 'string',
        }),
      ),
    ).toEqual({
      a: 1,
      b: '1',
      c: false,
      d: [1, 2, 3],
      e: 'string',
    })

    expect(
      assertOk(
        obj.validate({
          a: 1,
          b: '1',
          c: false,
          d: [1, 2, 3],
          e: 'string',
          f: 'not existed',
        }),
      ),
    ).toEqual({
      a: 1,
      b: '1',
      c: false,
      d: [1, 2, 3],
      e: 'string',
    })

    expect(() =>
      assertOk(
        obj.validate({
          a: 1,
          b: '1',
          c: false,
          e: 'field d is missing',
        }),
      ),
    ).toThrow()

    expect(() => assertOk(obj.validate(null))).toThrow()
    expect(() => assertOk(obj.validate(123))).toThrow()
  })

  it('supports union validation', () => {
    let numberOrString = union(strictNumber, strictBoolean, string)

    expect(assertOk(numberOrString.validate('10'))).toBe('10')
    expect(assertOk(numberOrString.validate(10))).toBe(10)
    expect(assertOk(numberOrString.validate('abc'))).toBe('abc')
    expect(assertOk(numberOrString.validate(false))).toBe(false)
  })

  it('supports intersect validation', () => {
    let obj0 = object({
      a: number,
    })
    let obj1 = object({
      b: string,
    })
    let obj2 = intersect(obj0, obj1)

    expect(assertOk(obj0.validate({ a: 1 }))).toEqual({ a: 1 })
    expect(assertOk(obj1.validate({ b: '1' }))).toEqual({ b: '1' })

    expect(() => assertOk(obj0.validate({ b: '1' }))).toThrow()

    expect(() => assertOk(obj1.validate({ a: 1 }))).toThrow()

    expect(
      assertOk(
        obj2.validate({
          a: 1,
          b: '1',
        }),
      ),
    ).toEqual({
      a: 1,
      b: '1',
    })

    expect(
      assertOk(
        obj2.validate({
          a: 1,
          b: '1',
          c: 3,
        }),
      ),
    ).toEqual({
      a: 1,
      b: '1',
    })

    expect(() => assertOk(obj2.validate({ b: '1' }))).toThrow()

    expect(() => assertOk(obj2.validate({ a: 1 }))).toThrow()
  })

  it('supports literal validation', () => {
    let literalOne = literal(1)
    let literalTwo = literal(2)
    let literalAAA = literal('AAA')
    let literalTrue = literal(true)

    expect(assertOk(literalOne.validate(1))).toBe(1)
    expect(assertOk(literalTwo.validate(2))).toBe(2)
    expect(assertOk(literalAAA.validate('AAA'))).toBe('AAA')
    expect(assertOk(literalTrue.validate(true))).toBe(true)

    expect(() => assertOk(literalOne.validate(2))).toThrow()
    expect(() => assertOk(literalTwo.validate(1))).toThrow()
    expect(() => assertOk(literalAAA.validate('aaa'))).toThrow()
    expect(() => assertOk(literalTrue.validate(false))).toThrow()
  })

  it('supports json validation', () => {
    expect(assertOk(json.validate(null))).toEqual(null)
    expect(assertOk(json.validate(1))).toEqual(1)
    expect(assertOk(json.validate('1'))).toEqual('1')
    expect(assertOk(json.validate(false))).toEqual(false)
    expect(assertOk(json.validate(true))).toEqual(true)

    expect(
      assertOk(
        json.validate({
          a: 1,
          b: 2,
          c: null,
          d: [1, '1', false],
        }),
      ),
    ).toEqual({
      a: 1,
      b: 2,
      c: null,
      d: [1, '1', false],
    })

    expect(assertOk(json.validate([1, 2, 3, 'false']))).toEqual([1, 2, 3, 'false'])

    expect(() => assertOk(json.validate(() => {}))).toThrow()
  })

  it('supports record validation', () => {
    let numberRecord = record(number)
    let stringRecord = record(string)

    expect(assertOk(numberRecord.validate({ a: 1, b: 1 }))).toEqual({ a: 1, b: 1 })

    expect(assertOk(stringRecord.validate({ a: 'a', b: 'b' }))).toEqual({ a: 'a', b: 'b' })

    expect(() => assertOk(numberRecord.validate({ a: 'a', b: 1 }))).toThrow()

    expect(() => assertOk(stringRecord.validate({ a: 'a', b: 1 }))).toThrow()
  })

  it('supports any pattern', () => {
    expect(assertOk(any.validate(0))).toEqual(0)
    expect(assertOk(any.validate('1'))).toEqual('1')
    expect(assertOk(any.validate(null))).toEqual(null)
    expect(assertOk(any.validate([1, 2, 3]))).toEqual([1, 2, 3])
    expect(assertOk(any.validate({ a: 1, b: 2 }))).toEqual({ a: 1, b: 2 })
    expect(assertOk(any.validate(false))).toEqual(false)
  })

  it('supports defining recursive schema via thunk', () => {
    type Nest = Type<{
      value: number
      nest?: Nest
    }>
    let nest: Nest = thunk(() => {
      return object({
        value: number,
        nest: nullable(nest),
      }) as Nest
    })

    expect(
      assertOk(
        nest.validate({
          value: 0,
          nest: {
            value: 1,
            nest: {
              value: 2,
              nest: {
                value: 3,
              },
            },
          },
        }),
      ),
    ).toEqual({
      value: 0,
      nest: {
        value: 1,
        nest: {
          value: 2,
          nest: {
            value: 3,
          },
        },
      },
    })

    expect(() => assertOk(nest.validate(null))).toThrow()
    expect(() =>
      assertOk(
        nest.validate({
          value: 'abc',
        }),
      ),
    ).toThrow()
  })
})
