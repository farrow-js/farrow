/**
 * Idea:
 * We don't need to carry type in generic type position
 * We can keep it in class fields, such like __type
 * Using this-type to access the instance-type
 * Perform some type-level programming to infer the type of Schema
 */
abstract class Schema {
  static new<T extends SchemaCtor, V extends TypeOfSchema<T>>(this: T, value: V) {
    return value
  }
  abstract __type: unknown
}

type SchemaCtor = new () => Schema

type TypeOfSchema<T extends SchemaCtor> = InstanceType<T>['__type']

class NumberType extends Schema {
  __type!: number
}

class StringType extends Schema {
  __type!: string
}

class BooleanType extends Schema {
  __type!: boolean
}

abstract class ListType extends Schema {
  __type!: TypeOfSchema<this['ItemType']>[]

  abstract ItemType: SchemaCtor
}

const List = <T extends SchemaCtor>(ItemType: T) => {
  return class List extends ListType {
    ItemType = ItemType
  }
}

abstract class ObjectType extends Schema {
  __type!: {
    [key in keyof this as this[key] extends SchemaCtor ? key : never]: this[key] extends SchemaCtor
      ? TypeOfSchema<this[key]>
      : never
  }
}

abstract class NullableType extends Schema {
  __type!: TypeOfSchema<this['ItemType']> | null
  abstract ItemType: SchemaCtor
}

const Nullable = <T extends SchemaCtor>(ItemType: T) => {
  return class Nullable extends NullableType {
    ItemType = ItemType
  }
}

abstract class UnionType extends Schema {
  __type!: TypeOfSchema<this['ItemTypes'][number]>
  abstract ItemTypes: SchemaCtor[]
}

const Union = <T extends SchemaCtor[]>(...ItemTypes: T) => {
  return class Union extends UnionType {
    ItemTypes = ItemTypes
  }
}

type Literals = number | string | boolean | null

abstract class LiteralType extends Schema {
  __type!: this['value']
  abstract value: Literals
}

const Literal = <T extends Literals>(value: T) => {
  return class Literal extends LiteralType {
    value = value
  }
}

class PersonName extends ObjectType {
  firstname = StringType
  middlename = Nullable(StringType)
  lastname = StringType
}

class Tag extends UnionType {
  ItemTypes = [Literal('happy'), Literal('sad'), Literal('angry')]
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
