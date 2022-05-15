Farrow-Schema API

`farrow-schema` is a powerful and extensible schema builder library.

## Installation

```shell
# via npm
npm install --save farrow-schema

# via yarn
yarn add farrow-schema
```

## API

```typescript
import {
  Schema, // abstract class inherited by all schema
  List, // List type constructor
  ObjectType, // abstract class of object type schema
  Int, // Int type
  Float, // Float type
  ID, // ID type
  Struct, // Struct type constructor
  Nullable, // Nullabel type constructor
  Union, // Union type constructor
  Intersect, // Intersection type constructor
  Literal, // Literal type constructor
  Record, // Record type constructor
  Json, // Json type
  Any, // Any type
  Strict, // Strict type constructor
  NonStrict, // NonStrict type constructor
  Tuple, // Tuple type constrcutor
  pick, // pick object/struct keys to create a new object/struct type
  omit, // omit object/struct keys to create a new object/struct type
  keyof, // get the keys of object/struct
} from 'farrow-schema'

// create transformer for transforming schema to another type
import { createTransformer } from 'farrow-schema/transformer'

// schema validator
import { Validator } from 'farrow-schema/validator'
```

## Usage

```typescript
import * as Schema from 'farrow-schema'
import { Validator } from 'farrow-schema/validator'

const { ObjectType, List, ID, Float, Nullable, Struct, Union, Intersect, Literal, Json, Any, Record } = Schema

// define User Object, it supports recursive definition
class User extends ObjectType {
  id = ID
  name = String
  orders = List(Order) // order list type
}

// define Order Object
class Order extends ObjectType {
  id = ID
  product = Product
  user = User
}

// define Product Object
class Product extends ObjectType {
  id = ID
  title = String
  description = String
  price = Float
}

// define AppState Object
class AppState extends ObjectType {
  descriptors = {
    a: Boolean,
    // a light way to construct struct type
    b: Struct({
      c: {
        d: List(Nullable(String)),
      },
    }),
  }

  struct = Struct({
    a: Number,
    b: String,
    c: {
      deep: {
        d: List(Boolean),
      },
    },
  })

  nullable = Nullable(List(Number))

  union = Union(List(Number), List(String), List(Boolean))

  intersect = Intersect(Struct({ a: String }), Struct({ b: Boolean }))

  record = Record(Product)

  literal = Literal(12)

  json = Json

  any = Any

  getUser = User
  getOrder = Order
  // supports { [Schema.Type]: SchemaCtor }
  getProduct = {
    [Schema.Type]: Product,
    description: 'get product',
  }
}

type T0 = Schema.TypeOf<AppState>

type T1 = Schema.TypeOf<User>

type T2 = Schema.TypeOf<Product>

const result0 = Validator.validate(Product, {
  id : 'product id'
  title : 'product title'
  description : 'product description'
  price : 1000.1
})

if (result0.isOk) {
  console.log(result0.value)
}
```

## ValidatorType

it's useful to build your own validator-type with custom validate function.

```typescript
import { ValidatorType } from 'farrow-schema/validator'

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
```

## RegExp

Given a `regexp` for creating a validator-type

```typescript
import { RegExp, createSchemaValidator } from 'farrow-schema/validator'

let Reg0 = RegExp(/123/)
let Reg1 = RegExp(/abc/i)

let validateReg0 = createSchemaValidator(Reg0)
let validateReg1 = createSchemaValidator(Reg1)

expect(assertOk(validateReg0('123'))).toBe('123')
expect(() => assertOk(validateReg0('12'))).toThrow()

expect(assertOk(validateReg1('abc'))).toBe('abc')
expect(assertOk(validateReg1('ABC'))).toBe('ABC')
expect(() => assertOk(validateReg1('cba'))).toThrow()
```
