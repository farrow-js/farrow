Farrow-Schema API

`farrow-schema` is a powerful and extensible schema builder library.

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
} from 'farrow-schema'

// create transformer for transforming schema to another type or structure
import { createTransformer } from 'farrow-schema/transformer'

// create schema validator by Schema
import { createSchemaValidator } from 'farrow-schema/validator'
```

## Usage

```typescript
import * as Schema from 'farrow-schema'
import { createSchemaValidator } from 'farrow-schema/validator'

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



const validator = createSchemaValidator(Product)

const result0 = validator({
  id : 'product id'
  title : 'product title'
  description : 'product description'
  price : 1000.1
})

if (result0.isOk) {
  console.log(result0.value)
}
```
