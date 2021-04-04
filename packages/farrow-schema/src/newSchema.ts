/**
 * Idea:
 * - We don't need to carry type in generic type position
 * - We can keep it in class fields, such like __type
 * - Using this-type to access the instance-type
 * - Perform some type-level programming to infer the type of Schema
 */
abstract class Schema {
  static new<T extends SchemaCtor>(this: T, value: TypeOf<T>) {
    return value
  }
  abstract __type: unknown
}

type SchemaCtor<T extends Schema = Schema> = new () => T

type TypeOf<T extends SchemaCtor> = InstanceType<T>['__type']

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
  __type!: TypeOf<this['ItemType']>[]

  abstract ItemType: SchemaCtor
}

const List = <T extends SchemaCtor>(ItemType: T) => {
  return class List extends ListType {
    ItemType = ItemType
  }
}

type SchemaField<T extends object, key extends keyof T> = T[key] extends undefined
  ? never
  : T[key] extends SchemaCtor | undefined
  ? key
  : never

type TypeOfField<T> = T extends SchemaCtor ? TypeOf<T> : T extends undefined ? undefined : never

abstract class ObjectType extends Schema {
  __type!: {
    [key in keyof this as SchemaField<this, key>]: TypeOfField<this[key]>
  }
}

abstract class OptionalType extends Schema {
  abstract ItemType: SchemaCtor
  __type!: TypeOf<this['ItemType']> | undefined
}

const Optional = <T extends SchemaCtor>(ItemType: T) => {
  return class Optional extends OptionalType {
    ItemType = ItemType
  }
}

abstract class UnionType extends Schema {
  __type!: TypeOf<this['ItemTypes'][number]>
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

const Null = Literal(null)

const Nullable = <T extends SchemaCtor>(Ctor: T) => {
  return Union(Ctor, Null)
}

type DescriptionInfo<T extends ObjectType = ObjectType> = {
  [key in keyof T['__type']]?: string
}

const descriptionWeakMap = new WeakMap<SchemaCtor<ObjectType>, DescriptionInfo>()

const Description = {
  impl<T extends ObjectType>(Ctor: SchemaCtor<T>, descriptionInfo: DescriptionInfo<T>) {
    descriptionWeakMap.set(Ctor, {
      ...descriptionWeakMap.get(Ctor),
      ...descriptionInfo,
    })
  },
  get<T extends ObjectType>(Ctor: SchemaCtor<T>): DescriptionInfo<T> {
    // eslint-disable-next-line
    new Ctor()
    return descriptionWeakMap.get(Ctor) ?? {}
  },
  getField<T extends ObjectType>(Ctor: SchemaCtor<T>, field: keyof T['__type']) {
    return this.get(Ctor)[field]
  },
}

const description = (description: string) => {
  return (target: object, key: string) => {
    Description.impl(target.constructor as any, {
      [key]: description,
    })
  }
}

type DeprecatedInfo<T extends ObjectType = ObjectType> = {
  [key in keyof T['__type']]?: string
}

const DeprecatedWeakMap = new WeakMap<SchemaCtor<ObjectType>, DeprecatedInfo>()

const Deprecated = {
  impl<T extends ObjectType>(Ctor: SchemaCtor<T>, DeprecatedInfo: DeprecatedInfo<T>) {
    DeprecatedWeakMap.set(Ctor, {
      ...DeprecatedWeakMap.get(Ctor),
      ...DeprecatedInfo,
    })
  },
  get<T extends ObjectType>(Ctor: SchemaCtor<T>): DeprecatedInfo<T> {
    // eslint-disable-next-line
    new Ctor()
    return DeprecatedWeakMap.get(Ctor) ?? {}
  },
  getField<T extends ObjectType>(Ctor: SchemaCtor<T>, field: keyof T['__type']) {
    return this.get(Ctor)[field]
  },
}

const deprecated = (deprecated: string) => {
  return (target: object, key: string) => {
    Deprecated.impl(target.constructor as any, {
      [key]: deprecated,
    })
  }
}

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

console.log('person name description info', Description.get(PersonName))
console.log('person name deprecated info', Deprecated.get(PersonName))

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

console.log('user', user)
