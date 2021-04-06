export * from './newSchema'
import {
  ObjectType,
  StringType,
  Nullable,
  Optional,
  UnionType,
  Literal,
  NumberType,
  BooleanType,
  List,
} from './newSchema'
import { deprecated } from './deprecatedInfo'
import { description } from './descriptionInfo'

class PersonName extends ObjectType {
  @description('first name of person')
  firstname = StringType

  @description('optional middle name of person')
  middlename = Nullable(StringType)

  @description('last name of person')
  lastname = StringType

  @deprecated('use lastname instead')
  surname? = Optional(StringType)
}

// Description.impl(PersonName, {
//   firstname: 'first name of person',
//   middlename: 'optional middle name of person',
//   lastname: 'last name of person',
// })

// Deprecated.impl(PersonName, {
//   surname: 'use lastname instead',
// })

class Tag extends UnionType {
  Items = [Literal('happy'), Literal('sad'), Literal('angry')]
}

class User extends ObjectType {
  type = Literal('User')
  name = PersonName
  age = NumberType
  isVip = BooleanType
  friends = List(User)
  tags = List(Tag)
}

type T0 = User['__type']

const user = User.new({
  type: 'User',
  name: {
    firstname: 'Jade',
    middlename: null,
    lastname: 'Gu',
  },
  age: 18,
  isVip: true,
  friends: [],
  tags: ['happy'],
})

console.log('user', user)
