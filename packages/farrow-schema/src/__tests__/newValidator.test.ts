import * as Schema from '../newSchema'
import { ReadOnly, TypeOf, ReadOnlyDeep } from '../newSchema'
import { createSchemaValidator, RegExp, ValidationResult, ValidatorType } from '../newValidator'

const { Type, ObjectType, Struct, Int, Float, Literal, List, Union, Intersect, Nullable, Record, Json, Any } = Schema

let assertOk = <T>(result: ValidationResult<T>): T => {
  if (result.isOk) return result.value
  throw new Error(result.value.message)
}

describe('Validator', () => {
  it('supports number validation', () => {
    let validate = createSchemaValidator(Schema.Number)

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
    let validate = createSchemaValidator(Int)

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
    let validate = createSchemaValidator(Float)

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
    let validate = createSchemaValidator(Schema.String)

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
    let validate = createSchemaValidator(Schema.Boolean)

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
    let validate = createSchemaValidator(Schema.ID)

    expect(() => assertOk(validate(''))).toThrow()
    expect(assertOk(validate('123'))).toBe('123')

    expect(() => assertOk(validate(123))).toThrow()

    expect(() => assertOk(validate(false))).toThrow()

    expect(() => assertOk(validate(Number))).toThrow()

    expect(() => assertOk(validate([]))).toThrow()

    expect(() => assertOk(validate(null))).toThrow()

    expect(() => assertOk(validate({}))).toThrow()
  })

  it('supports nullable validation', () => {
    let validateNullableNumber = createSchemaValidator(Nullable(Number))
    let validateNullableString = createSchemaValidator(Nullable(String))
    let validateNullableBoolean = createSchemaValidator(Nullable(Boolean))

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
    let validateNumbers = createSchemaValidator(List(Number))
    let validateStrings = createSchemaValidator(List(String))
    let validateBooleans = createSchemaValidator(List(Boolean))

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

    let validate = createSchemaValidator(Obj)

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
    let Struct0 = Struct({
      a: {
        [Type]: Number,
      },
      b: {
        [Type]: String,
      },
      c: Boolean,
    })

    let Struct1 = Struct({
      struct0: {
        [Type]: Struct0,
      },
      d: List(Number),
    })

    let validateStruct0 = createSchemaValidator(Struct0)
    let validateStruct1 = createSchemaValidator(Struct1)

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
    let validate = createSchemaValidator(Union(Number, Boolean, String))

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

    let Obj2 = Intersect(Obj0, Obj1)

    let validateObj0 = createSchemaValidator(Obj0)
    let validateObj1 = createSchemaValidator(Obj1)
    let validateObj2 = createSchemaValidator(Obj2)

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
    let validateLiteralOne = createSchemaValidator(Literal(1))
    let validateLiteralTwo = createSchemaValidator(Literal(2))
    let validateLiteralAAA = createSchemaValidator(Literal('AAA'))
    let validateLiteralTrue = createSchemaValidator(Literal(true))

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
    let validateJson = createSchemaValidator(Json)

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
    let validateNumberRecord = createSchemaValidator(Record(Number))
    let validateStringRecord = createSchemaValidator(Record(String))

    expect(assertOk(validateNumberRecord({ a: 1, b: 1 }))).toEqual({ a: 1, b: 1 })

    expect(assertOk(validateStringRecord({ a: 'a', b: 'b' }))).toEqual({ a: 'a', b: 'b' })

    expect(() => assertOk(validateNumberRecord({ a: 'a', b: 1 }))).toThrow()

    expect(() => assertOk(validateStringRecord({ a: 'a', b: 1 }))).toThrow()
  })

  it('supports any pattern', () => {
    let validateAny = createSchemaValidator(Any)
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

    let validateNest = createSchemaValidator(Nest)

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

  // it('should support flexible FieldDescriptors as argument', () => {
  //   let list = List({
  //     a: Number,
  //   })

  //   let nullable = Nullable({
  //     a: Number,
  //   })

  //   let union = Union(
  //     {
  //       a: Number,
  //     },
  //     {
  //       b: String,
  //     },
  //   )

  //   let intersect = Intersect(
  //     {
  //       a: Number,
  //     },
  //     {
  //       b: String,
  //     },
  //   )

  //   let record = Record({
  //     a: Number,
  //   })

  //   let validateList = createSchemaValidator(list)
  //   let validateNullable = createSchemaValidator(nullable)
  //   let validateUnion = createSchemaValidator(union)
  //   let validateIntersect = createSchemaValidator(intersect)
  //   let validateRecord = createSchemaValidator(record)

  //   expect(assertOk(validateList([]))).toEqual([])
  //   expect(
  //     assertOk(
  //       validateList([
  //         {
  //           a: 1,
  //           b: 2,
  //         },
  //         {
  //           a: 2,
  //           b: 3,
  //         },
  //       ]),
  //     ),
  //   ).toEqual([
  //     {
  //       a: 1,
  //     },
  //     {
  //       a: 2,
  //     },
  //   ])

  //   expect(assertOk(validateNullable(null))).toEqual(null)
  //   expect(assertOk(validateNullable(undefined))).toEqual(undefined)

  //   expect(assertOk(validateUnion({ a: 1 }))).toEqual({
  //     a: 1,
  //   })

  //   expect(assertOk(validateUnion({ b: '1' }))).toEqual({
  //     b: '1',
  //   })

  //   expect(assertOk(validateIntersect({ a: 1, b: '1' }))).toEqual({
  //     a: 1,
  //     b: '1',
  //   })

  //   expect(
  //     assertOk(
  //       validateRecord({
  //         key0: {
  //           a: 1,
  //         },
  //         key1: {
  //           a: 2,
  //         },
  //       }),
  //     ),
  //   ).toEqual({
  //     key0: {
  //       a: 1,
  //     },
  //     key1: {
  //       a: 2,
  //     },
  //   })
  // })

  it('support strict or non-strict validation', () => {
    let struct = Struct({
      a: Number,
      b: Int,
      c: Boolean,
      d: Literal(1),
      e: Literal(false),
    })

    let validate0 = createSchemaValidator(struct)

    let validate1 = createSchemaValidator(Schema.NonStrict(struct))

    // valid data for both
    let data0 = {
      a: 1.23,
      b: 1,
      c: false,
      d: 1,
      e: false,
    }

    // invalid for strict mode, valid for non-strict mode
    let data1 = {
      a: 1,
      b: 1.1,
      c: 'false',
      d: '1',
      e: 'false',
    }

    let data2 = {
      a: '1',
      b: '1.1',
      c: true,
      d: 1,
      e: 'false',
    }

    let data3 = {
      a: '1.1',
      b: '1',
      c: 'true',
      d: '1',
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
  })

  it('supports read-only and read-only-deep', () => {
    let Struct0 = Struct({
      a: Number,
      b: String,
      c: {
        d: Boolean,
      },
    })

    let ReadOnlyStruct = ReadOnly(Struct0)
    let ReadOnlyDeepStruct = ReadOnlyDeep(Struct0)

    type T0 = TypeOf<typeof Struct0>

    // type T1 = Prettier<TypeOf<typeof ReadOnlyStruct>>

    // type T2 = Prettier<TypeOf<typeof ReadOnlyDeepStruct>>

    let data: T0 = {
      a: 1,
      b: '1',
      c: {
        d: false,
      },
    }

    let validate0 = createSchemaValidator(Struct0)

    let validate1 = createSchemaValidator(ReadOnlyStruct)

    let validate2 = createSchemaValidator(ReadOnlyDeepStruct)

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

    let User = Struct({
      name: String,
      email: EmailType,
      createAt: DateType,
    })

    let validateUser = createSchemaValidator(User)

    let result0 = assertOk(
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
    let Reg0 = RegExp(/123/)
    let Reg1 = RegExp(/abc/i)

    let validateReg0 = createSchemaValidator(Reg0)
    let validateReg1 = createSchemaValidator(Reg1)

    expect(assertOk(validateReg0('123'))).toBe('123')
    expect(() => assertOk(validateReg0('12'))).toThrow()

    expect(assertOk(validateReg1('abc'))).toBe('abc')
    expect(assertOk(validateReg1('ABC'))).toBe('ABC')
    expect(() => assertOk(validateReg1('cba'))).toThrow()
  })
})
