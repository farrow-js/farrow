import * as Schema from '../src/schema'
import { ReadOnly, TypeOf, ReadOnlyDeep } from '../src/schema'
import { createSchemaValidator, RegExp, ValidationResult, Validator, ValidatorType } from '../src/validator'
import { pick, omit, keyof, partial } from '../src/helper'

const { Type, ObjectType, Struct, Int, Float, Literal, List, Union, Intersect, Nullable, Record, Json, Any, Tuple } =
  Schema

const assertOk = <T>(result: ValidationResult<T>): T => {
  if (result.isOk) return result.value
  throw new Error(result.value.message)
}

describe('Validator', () => {
  it('supports number validation', () => {
    const validate = createSchemaValidator(Schema.Number)

    expect(assertOk(validate(1))).toBe(1)

    expect(assertOk(validate(1.1))).toBe(1.1)

    expect(() => assertOk(validate('1'))).toThrow()

    expect(() => assertOk(validate('abc'))).toThrow()

    expect(() => assertOk(validate(false))).toThrow()

    expect(() => assertOk(validate(Number))).toThrow()

    expect(() => assertOk(validate([]))).toThrow()

    expect(() => assertOk(validate(null))).toThrow()

    expect(() => assertOk(validate({}))).toThrow()
  })

  it('supports integer validation', () => {
    const validate = createSchemaValidator(Int)

    expect(assertOk(validate(1))).toBe(1)

    expect(() => assertOk(validate(1.1))).toThrow()

    expect(() => assertOk(validate('1'))).toThrow()

    expect(() => assertOk(validate('abc'))).toThrow()

    expect(() => assertOk(validate(false))).toThrow()

    expect(() => assertOk(validate(Number))).toThrow()

    expect(() => assertOk(validate([]))).toThrow()

    expect(() => assertOk(validate(null))).toThrow()

    expect(() => assertOk(validate({}))).toThrow()
  })

  it('supports float validation', () => {
    const validate = createSchemaValidator(Float)

    expect(assertOk(validate(1))).toBe(1)

    expect(assertOk(validate(1.1))).toBe(1.1)

    expect(() => assertOk(validate('1'))).toThrow()

    expect(() => assertOk(validate('abc'))).toThrow()

    expect(() => assertOk(validate(false))).toThrow()

    expect(() => assertOk(validate(Number))).toThrow()

    expect(() => assertOk(validate([]))).toThrow()

    expect(() => assertOk(validate(null))).toThrow()

    expect(() => assertOk(validate({}))).toThrow()
  })

  it('supports string validation', () => {
    const validate = createSchemaValidator(Schema.String)

    expect(assertOk(validate(''))).toBe('')
    expect(assertOk(validate('123'))).toBe('123')

    expect(() => assertOk(validate(123))).toThrow()

    expect(() => assertOk(validate(false))).toThrow()

    expect(() => assertOk(validate(Number))).toThrow()

    expect(() => assertOk(validate([]))).toThrow()

    expect(() => assertOk(validate(null))).toThrow()

    expect(() => assertOk(validate({}))).toThrow()
  })

  it('supports boolean validation', () => {
    const validate = createSchemaValidator(Schema.Boolean)

    expect(assertOk(validate(true))).toBe(true)
    expect(assertOk(validate(false))).toBe(false)

    expect(() => assertOk(validate('true'))).toThrow()
    expect(() => assertOk(validate('false'))).toThrow()

    expect(() => assertOk(validate(123))).toThrow()

    expect(() => assertOk(validate('adf'))).toThrow()

    expect(() => assertOk(validate(Number))).toThrow()

    expect(() => assertOk(validate([]))).toThrow()

    expect(() => assertOk(validate(null))).toThrow()

    expect(() => assertOk(validate({}))).toThrow()
  })

  it('supports ID validation', () => {
    const validate = createSchemaValidator(Schema.ID)

    expect(() => assertOk(validate(''))).toThrow()
    expect(assertOk(validate('123'))).toBe('123')

    expect(() => assertOk(validate(123))).toThrow()

    expect(() => assertOk(validate(false))).toThrow()

    expect(() => assertOk(validate(Number))).toThrow()

    expect(() => assertOk(validate([]))).toThrow()

    expect(() => assertOk(validate(null))).toThrow()

    expect(() => assertOk(validate({}))).toThrow()
  })

  it('supports Date validation', () => {
    const validate = createSchemaValidator(Schema.Date)

    expect(() => assertOk(validate(''))).toThrow()

    const a = new Date()
    expect(assertOk(validate(a))).toBe(a)

    expect(assertOk(validate(a.getTime())).getTime()).toBe(a.getTime())

    expect(assertOk(validate(a.toJSON())).getTime()).toBe(a.getTime())

    expect(() => assertOk(validate(false))).toThrow()

    expect(() => assertOk(validate(Number))).toThrow()

    expect(() => assertOk(validate([]))).toThrow()

    expect(() => assertOk(validate(null))).toThrow()

    expect(() => assertOk(validate({}))).toThrow()
  })

  it('supports nullable validation', () => {
    const validateNullableNumber = createSchemaValidator(Nullable(Number))
    const validateNullableString = createSchemaValidator(Nullable(String))
    const validateNullableBoolean = createSchemaValidator(Nullable(Boolean))

    expect(assertOk(validateNullableNumber(null))).toBe(null)
    expect(assertOk(validateNullableNumber(undefined))).toBe(undefined)
    expect(assertOk(validateNullableNumber(1))).toBe(1)

    expect(assertOk(validateNullableString(null))).toBe(null)
    expect(assertOk(validateNullableString(undefined))).toBe(undefined)
    expect(assertOk(validateNullableString('1'))).toBe('1')

    expect(assertOk(validateNullableBoolean(null))).toBe(null)
    expect(assertOk(validateNullableBoolean(undefined))).toBe(undefined)
    expect(assertOk(validateNullableBoolean(true))).toBe(true)
    expect(assertOk(validateNullableBoolean(false))).toBe(false)
  })

  it('supports list validation', () => {
    const validateNumbers = createSchemaValidator(List(Number))
    const validateStrings = createSchemaValidator(List(String))
    const validateBooleans = createSchemaValidator(List(Boolean))

    expect(assertOk(validateNumbers([1, 2, 3]))).toEqual([1, 2, 3])

    expect(() => assertOk(validateNumbers(['1', '2', '3']))).toThrow()

    expect(() => assertOk(validateNumbers(['a', 'b', 'c']))).toThrow()

    expect(assertOk(validateStrings(['a', 'b', 'c']))).toEqual(['a', 'b', 'c'])

    expect(assertOk(validateStrings(['1', '2', '3']))).toEqual(['1', '2', '3'])

    expect(() => assertOk(validateStrings([1, 2, 3]))).toThrow()

    expect(assertOk(validateBooleans([true, false, true]))).toEqual([true, false, true])

    expect(() => assertOk(validateBooleans(['true', false, 'true']))).toThrow()

    expect(() => assertOk(validateBooleans([1, 2, 3]))).toThrow()
  })

  it('supports object validation', () => {
    class Obj extends ObjectType {
      a = Number
      b = String
      c = Boolean
      d = {
        [Type]: List(Number),
      }
      e = {
        [Type]: Nullable(String),
      }
    }

    const validate = createSchemaValidator(Obj)

    expect(
      assertOk(
        validate({
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
        validate({
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
        validate({
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
        validate({
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
        validate({
          a: 1,
          b: '1',
          c: false,
          e: 'field d is missing',
        }),
      ),
    ).toThrow()

    expect(() => assertOk(validate(null))).toThrow()
    expect(() => assertOk(validate(123))).toThrow()
  })

  it('supports struct validation', () => {
    const Struct0 = Struct({
      a: {
        [Type]: Number,
      },
      b: {
        [Type]: String,
      },
      c: Boolean,
    })

    const Struct1 = Struct({
      struct0: {
        [Type]: Struct0,
      },
      d: List(Number),
    })

    const validateStruct0 = createSchemaValidator(Struct0)
    const validateStruct1 = createSchemaValidator(Struct1)

    expect(
      assertOk(
        validateStruct0({
          a: 1,
          b: '1',
          c: false,
        }),
      ),
    ).toEqual({
      a: 1,
      b: '1',
      c: false,
    })

    expect(() =>
      assertOk(
        validateStruct0({
          a: 1,
          b: 1,
          c: false,
        }),
      ),
    ).toThrow()

    expect(
      assertOk(
        validateStruct1({
          struct0: {
            a: 1,
            b: '1',
            c: false,
          },
          d: [1, 2, 3],
          f: 123,
        }),
      ),
    ).toEqual({
      struct0: {
        a: 1,
        b: '1',
        c: false,
      },
      d: [1, 2, 3],
    })
  })

  it('supports union validation', () => {
    const validate = createSchemaValidator(Union(Number, Boolean, String))

    expect(assertOk(validate('10'))).toBe('10')
    expect(assertOk(validate(10))).toBe(10)
    expect(assertOk(validate('abc'))).toBe('abc')
    expect(assertOk(validate(false))).toBe(false)
  })

  it('supports intersect validation', () => {
    class Obj0 extends ObjectType {
      a = Number
    }

    class Obj1 extends ObjectType {
      b = String
    }

    const Obj2 = Intersect(Obj0, Obj1)

    const validateObj0 = createSchemaValidator(Obj0)
    const validateObj1 = createSchemaValidator(Obj1)
    const validateObj2 = createSchemaValidator(Obj2)

    expect(assertOk(validateObj0({ a: 1 }))).toEqual({ a: 1 })
    expect(assertOk(validateObj1({ b: '1' }))).toEqual({ b: '1' })

    expect(() => assertOk(validateObj0({ b: '1' }))).toThrow()

    expect(() => assertOk(validateObj1({ a: 1 }))).toThrow()

    expect(
      assertOk(
        validateObj2({
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
        validateObj2({
          a: 1,
          b: '1',
          c: 3,
        }),
      ),
    ).toEqual({
      a: 1,
      b: '1',
    })

    expect(() => assertOk(validateObj2({ b: '1' }))).toThrow()

    expect(() => assertOk(validateObj2({ a: 1 }))).toThrow()
  })

  it('supports literal validation', () => {
    const validateLiteralOne = createSchemaValidator(Literal(1))
    const validateLiteralTwo = createSchemaValidator(Literal(2))
    const validateLiteralAAA = createSchemaValidator(Literal('AAA'))
    const validateLiteralTrue = createSchemaValidator(Literal(true))

    expect(assertOk(validateLiteralOne(1))).toBe(1)
    expect(assertOk(validateLiteralTwo(2))).toBe(2)
    expect(assertOk(validateLiteralAAA('AAA'))).toBe('AAA')
    expect(assertOk(validateLiteralTrue(true))).toBe(true)

    expect(() => assertOk(validateLiteralOne(2))).toThrow()
    expect(() => assertOk(validateLiteralTwo(1))).toThrow()
    expect(() => assertOk(validateLiteralAAA('aaa'))).toThrow()
    expect(() => assertOk(validateLiteralTrue(false))).toThrow()
  })

  it('supports json validation', () => {
    const validateJson = createSchemaValidator(Json)

    expect(assertOk(validateJson(null))).toEqual(null)
    expect(assertOk(validateJson(1))).toEqual(1)
    expect(assertOk(validateJson('1'))).toEqual('1')
    expect(assertOk(validateJson(false))).toEqual(false)
    expect(assertOk(validateJson(true))).toEqual(true)

    expect(
      assertOk(
        validateJson({
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

    expect(assertOk(validateJson([1, 2, 3, 'false']))).toEqual([1, 2, 3, 'false'])

    expect(() => assertOk(validateJson(() => undefined))).toThrow()
  })

  it('supports record validation', () => {
    const validateNumberRecord = createSchemaValidator(Record(Number))
    const validateStringRecord = createSchemaValidator(Record(String))

    expect(assertOk(validateNumberRecord({ a: 1, b: 1 }))).toEqual({ a: 1, b: 1 })

    expect(assertOk(validateStringRecord({ a: 'a', b: 'b' }))).toEqual({ a: 'a', b: 'b' })

    expect(() => assertOk(validateNumberRecord({ a: 'a', b: 1 }))).toThrow()

    expect(() => assertOk(validateStringRecord({ a: 'a', b: 1 }))).toThrow()
  })

  it('supports any pattern', () => {
    const validateAny = createSchemaValidator(Any)
    expect(assertOk(validateAny(0))).toEqual(0)
    expect(assertOk(validateAny('1'))).toEqual('1')
    expect(assertOk(validateAny(null))).toEqual(null)
    expect(assertOk(validateAny([1, 2, 3]))).toEqual([1, 2, 3])
    expect(assertOk(validateAny({ a: 1, b: 2 }))).toEqual({ a: 1, b: 2 })
    expect(assertOk(validateAny(false))).toEqual(false)
  })

  it('supports defining recursive schema via ObjectType', () => {
    class Nest extends ObjectType {
      value = Number
      nest = Nullable(Nest)
    }

    const validateNest = createSchemaValidator(Nest)

    expect(
      assertOk(
        validateNest({
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

    expect(() => assertOk(validateNest(null))).toThrow()
    expect(() =>
      assertOk(
        validateNest({
          value: 'abc',
        }),
      ),
    ).toThrow()
  })

  it('should support flexible FieldDescriptors as argument', () => {
    const list = List({
      a: Number,
    })

    const nullable = Nullable({
      a: Number,
    })

    const union = Union(
      {
        a: Number,
      },
      {
        b: String,
      },
    )

    const intersect = Intersect(
      {
        a: Number,
      },
      {
        b: String,
      },
    )

    const record = Record({
      a: Number,
    })

    const validateList = createSchemaValidator(list)
    const validateNullable = createSchemaValidator(nullable)
    const validateUnion = createSchemaValidator(union)
    const validateIntersect = createSchemaValidator(intersect)
    const validateRecord = createSchemaValidator(record)

    expect(assertOk(validateList([]))).toEqual([])
    expect(
      assertOk(
        validateList([
          {
            a: 1,
            b: 2,
          },
          {
            a: 2,
            b: 3,
          },
        ]),
      ),
    ).toEqual([
      {
        a: 1,
      },
      {
        a: 2,
      },
    ])

    expect(assertOk(validateNullable(null))).toEqual(null)
    expect(assertOk(validateNullable(undefined))).toEqual(undefined)

    expect(assertOk(validateUnion({ a: 1 }))).toEqual({
      a: 1,
    })

    expect(assertOk(validateUnion({ b: '1' }))).toEqual({
      b: '1',
    })

    expect(assertOk(validateIntersect({ a: 1, b: '1' }))).toEqual({
      a: 1,
      b: '1',
    })

    expect(
      assertOk(
        validateRecord({
          key0: {
            a: 1,
          },
          key1: {
            a: 2,
          },
        }),
      ),
    ).toEqual({
      key0: {
        a: 1,
      },
      key1: {
        a: 2,
      },
    })
  })

  it('support strict or non-strict validation', () => {
    const struct = Struct({
      a: Number,
      b: Int,
      c: Boolean,
      d: Literal(1),
      e: Literal(false),
    })

    const validate0 = createSchemaValidator(struct)

    const validate1 = createSchemaValidator(Schema.NonStrict(struct))

    // valid data for both
    const data0 = {
      a: 1.23,
      b: 1,
      c: false,
      d: 1,
      e: false,
    }

    // invalid for strict mode, valid for non-strict mode
    const data1 = {
      a: 1,
      b: 1.1,
      c: 'false',
      d: '1',
      e: 'false',
    }

    const data2 = {
      a: '1',
      b: '1.1',
      c: true,
      d: 1,
      e: 'false',
    }

    const data3 = {
      a: '1.1',
      b: '1',
      c: 'true',
      d: '1',
      e: false,
    }

    const data4 = {
      a: '1.1',
      b: '1',
      c: 'true',
      d: '2',
      e: false,
    }

    expect(assertOk(validate0(data0))).toEqual({
      a: 1.23,
      b: 1,
      c: false,
      d: 1,
      e: false,
    })

    expect(assertOk(validate1(data0))).toEqual({
      a: 1.23,
      b: 1,
      c: false,
      d: 1,
      e: false,
    })

    expect(() => assertOk(validate0(data1))).toThrow()

    expect(assertOk(validate1(data1))).toEqual({
      a: 1,
      b: 1,
      c: false,
      d: 1,
      e: false,
    })

    expect(() => assertOk(validate0(JSON.stringify(data1)))).toThrow()

    expect(assertOk(validate1(JSON.stringify(data1)))).toEqual({
      a: 1,
      b: 1,
      c: false,
      d: 1,
      e: false,
    })

    expect(() => assertOk(validate0(data2))).toThrow()

    expect(assertOk(validate1(data2))).toEqual({
      a: 1,
      b: 1,
      c: true,
      d: 1,
      e: false,
    })

    expect(() => assertOk(validate0(data3))).toThrow()

    expect(assertOk(validate1(data3))).toEqual({
      a: 1.1,
      b: 1,
      c: true,
      d: 1,
      e: false,
    })

    expect(() => assertOk(validate0(data4))).toThrow()
    expect(() => assertOk(validate1(data4))).toThrow()
  })

  it('supports read-only and read-only-deep', () => {
    const Struct0 = Struct({
      a: Number,
      b: String,
      c: {
        d: Boolean,
      },
    })

    const ReadOnlyStruct = ReadOnly(Struct0)
    const ReadOnlyDeepStruct = ReadOnlyDeep(Struct0)

    type T0 = TypeOf<typeof Struct0>

    // type T1 = TypeOf<typeof ReadOnlyStruct>

    // type T2 = TypeOf<typeof ReadOnlyDeepStruct>

    const data: T0 = {
      a: 1,
      b: '1',
      c: {
        d: false,
      },
    }

    const validate0 = createSchemaValidator(Struct0)

    const validate1 = createSchemaValidator(ReadOnlyStruct)

    const validate2 = createSchemaValidator(ReadOnlyDeepStruct)

    expect(assertOk(validate0(data))).toEqual({
      a: 1,
      b: '1',
      c: {
        d: false,
      },
    })

    expect(assertOk(validate1(data))).toEqual({
      a: 1,
      b: '1',
      c: {
        d: false,
      },
    })

    expect(assertOk(validate2(data))).toEqual({
      a: 1,
      b: '1',
      c: {
        d: false,
      },
    })
  })

  it('supports validate tuple', () => {
    const Test = Tuple({ a: Literal('a') }, { b: Literal('b') })

    type Test = TypeOf<typeof Test>

    const test: Test = [{ a: 'a' }, { b: 'b' }]

    expect(assertOk(Validator.validate(Test, test))).toEqual([{ a: 'a' }, { b: 'b' }])

    expect(() => assertOk(Validator.validate(Test, []))).toThrow()
  })

  it('supports built-in validate schema', () => {
    class DateType extends ValidatorType<Date> {
      validate(input: unknown) {
        if (input instanceof Date) {
          return this.Ok(input)
        }

        if (typeof input === 'number' || typeof input === 'string') {
          return this.Ok(new Date(input))
        }

        return this.Err(`${input} is not a valid date`)
      }
    }

    class EmailType extends ValidatorType<string> {
      validate(input: unknown) {
        if (typeof input !== 'string') {
          return this.Err(`${input} should be a string`)
        }

        if (/^example@farrow\.com$/.test(input)) {
          return this.Ok(input)
        }

        return this.Err(`${input} is not a valid email`)
      }
    }

    const User = Struct({
      name: String,
      email: EmailType,
      createAt: DateType,
    })

    const validateUser = createSchemaValidator(User)

    const result0 = assertOk(
      validateUser({
        name: 'test',
        email: 'example@farrow.com',
        createAt: Date.now(),
      }),
    )

    expect(result0.name).toBe('test')
    expect(result0.email).toBe('example@farrow.com')
    expect(result0.createAt instanceof Date).toBe(true)

    expect(() =>
      assertOk(
        validateUser({
          name: 'test',
          email: 'example1@farrow.com',
          createAt: Date.now(),
        }),
      ),
    ).toThrow()
  })

  it('supports RegExp Schema', () => {
    const Reg0 = RegExp(/123/)
    const Reg1 = RegExp(/abc/i)

    const validateReg0 = createSchemaValidator(Reg0)
    const validateReg1 = createSchemaValidator(Reg1)

    expect(assertOk(validateReg0('123'))).toBe('123')
    expect(() => assertOk(validateReg0('12'))).toThrow()

    expect(assertOk(validateReg1('abc'))).toBe('abc')
    expect(assertOk(validateReg1('ABC'))).toBe('ABC')
    expect(() => assertOk(validateReg1('cba'))).toThrow()
  })

  it('supports pick object schema', () => {
    class Test extends ObjectType {
      a = String
      b = Number
      c = Boolean
    }

    const Test1 = pick(Test, ['a'])
    const Test2 = pick(Test, ['b', 'c'])

    expect(
      assertOk(
        Validator.validate(Test, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      a: '123',
      b: 123,
      c: false,
    })

    expect(
      assertOk(
        Validator.validate(Test1, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      a: '123',
    })

    expect(
      assertOk(
        Validator.validate(Test2, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      b: 123,
      c: false,
    })
  })

  it('supports omit object schema', () => {
    class Test extends ObjectType {
      a = String
      b = Number
      c = Boolean
    }

    const Test1 = omit(Test, ['b', 'c'])
    const Test2 = omit(Test, ['a'])

    expect(
      assertOk(
        Validator.validate(Test, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      a: '123',
      b: 123,
      c: false,
    })

    expect(
      assertOk(
        Validator.validate(Test1, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      a: '123',
    })

    expect(
      assertOk(
        Validator.validate(Test2, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      b: 123,
      c: false,
    })
  })

  it('supports pick struct schema', () => {
    const Test = Struct({
      a: String,
      b: Number,
      c: Boolean,
    })

    const Test1 = pick(Test, ['a'])
    const Test2 = pick(Test, ['b', 'c'])

    expect(
      assertOk(
        Validator.validate(Test, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      a: '123',
      b: 123,
      c: false,
    })

    expect(
      assertOk(
        Validator.validate(Test1, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      a: '123',
    })

    expect(
      assertOk(
        Validator.validate(Test2, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      b: 123,
      c: false,
    })
  })

  it('supports omit struct schema', () => {
    const Test = Struct({
      a: String,
      b: Number,
      c: Boolean,
    })

    const Test1 = omit(Test, ['b', 'c'])
    const Test2 = omit(Test, ['a'])

    expect(
      assertOk(
        Validator.validate(Test, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      a: '123',
      b: 123,
      c: false,
    })

    expect(
      assertOk(
        Validator.validate(Test1, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      a: '123',
    })

    expect(
      assertOk(
        Validator.validate(Test2, {
          a: '123',
          b: 123,
          c: false,
        }),
      ),
    ).toEqual({
      b: 123,
      c: false,
    })
  })

  it('support keyof object/struct', () => {
    class TestObject extends ObjectType {
      a = Int
      b = Int
      c = Int
    }

    const TestStruct = Struct({
      d: Int,
      e: Int,
      f: Int,
    })

    const testObjectKeys = keyof(TestObject)
    const testStructKeys = keyof(TestStruct)

    const keys0: typeof testObjectKeys = ['a', 'b', 'c']
    const keys1: typeof testStructKeys = ['d', 'e', 'f']

    expect(testObjectKeys).toEqual(keys0)
    expect(testStructKeys).toEqual(keys1)
  })

  it('support partial operator', () => {
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

    expect(assertOk(Validator.validate(PartialUser, {}))).toEqual({})
    expect(assertOk(Validator.validate(PartialUser, { name: 'only-name' }))).toEqual({ name: 'only-name' })
    expect(() => assertOk(Validator.validate(PartialUser, { friends: [{}, {}] }))).toThrow()

    expect(
      assertOk(
        Validator.validate(PartialUser, {
          friends: [
            {
              name: 'name',
              friends: [],
            },
          ],
        }),
      ),
    ).toEqual({
      friends: [
        {
          name: 'name',
          friends: [],
        },
      ],
    })

    expect(assertOk(Validator.validate(PartialPerson, {}))).toEqual({})
    expect(assertOk(Validator.validate(PartialPerson, { name: 'only-name' }))).toEqual({ name: 'only-name' })
    expect(assertOk(Validator.validate(PartialPerson, { name: 'name', age: 1 }))).toEqual({ name: 'name', age: 1 })
  })
})
