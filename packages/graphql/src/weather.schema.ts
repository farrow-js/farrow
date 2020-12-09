import {
  InputObjectType,
  Float,
  TypeOf,
  ObjectType,
  field,
  typename,
  ID,
  Int,
  String,
  Nullable,
  List,
  ScalarType,
  EnumType,
  InterfaceType,
  EnumValueConfig,
} from './graphql'

class Point2D extends InputObjectType {
  __typename = typename('Point2D')

  @format('abc')
  x = field({
    type: Float,
  })

  y = field({
    type: Float,
  })
}

type T0 = TypeOf<Point2D>

type T1 = typeof City['typename']

class City extends ObjectType {
  static typename = 'City'

  static description = 'City'

  __typename = typename('City')

  id = field({
    type: ID,
    description: 'City ID',
  })

  name = field({
    type: String,
    description: 'City name',
  })

  country = field({
    type: String,
    description: 'Country of City',
  })

  coord = field({
    type: Coordinates,
    description: 'Coordinates of City',
  })

  weather = field({
    type: Weather,
    description: 'Weather of City',
  })

  upload = field({
    type: Upload,
  })
}

class Coordinates extends ObjectType {
  __typename = typename('Coordinates')

  lon = field({
    type: Float,
  })

  lat = field({
    type: Float,
  })
}

class Clouds extends ObjectType {
  __typename = typename('Clouds')

  all = field({
    type: Int,
  })

  visibility = field({
    type: Int,
  })

  humidity = field({
    type: Int,
  })
}

class ConfigInput extends InputObjectType {
  __typename = typename('ConfigInput')

  units = field({
    type: Unit,
  })

  lang = field({
    type: Language,
  })
}

class Language extends EnumType {
  __typename = typename('Language')

  af = {
    value: 0 as const,
  }

  al = {
    value: 1 as const,
  }
}

class Query extends ObjectType {
  __typename = typename('Query')

  getCityByName = field({
    args: {
      name: {
        type: String,
      },
      country: {
        type: Nullable(String),
      },
      config: {
        type: Nullable(ConfigInput),
      },
    },
    type: City,
  })

  getCityById = field({
    args: {
      id: {
        type: Nullable(List(String)),
      },
      config: {
        type: Nullable(ConfigInput),
      },
    },
    type: List(City),
  })
}

class Summary extends ObjectType {
  __typename = typename('Summary')

  title = field({
    type: String,
  })

  description = field({
    type: String,
  })

  icon = field({
    type: String,
  })
}

class Temperature extends ObjectType {
  __typename = typename('Temperature')

  actual = field({
    type: Float,
  })

  feelsLike = field({
    type: Float,
  })

  min = field({
    type: Float,
  })

  max = field({
    type: Float,
  })
}

class Unit extends EnumType {
  __typename = typename('Unit')

  metric = {
    value: 0 as const,
  }

  imperial = {
    value: 1 as const,
  }

  kelvin = {
    value: 2 as const,
  }
}

class Upload extends ScalarType<'Upload'> {
  __typename = typename('Upload')
}

class Weather extends ObjectType {
  __typename = typename('Weather')

  summary = field({
    type: Summary,
  })

  temperature = field({
    type: Temperature,
  })

  wind = field({
    type: Wind,
  })

  clouds = field({
    type: Clouds,
  })

  timestamp = field({
    type: Int,
  })
}

class Wind extends ObjectType {
  __typename = typename('Wind')

  __interfaces = [Test, Error]

  speed = field({
    type: Float,
  })

  deg = field({
    type: Int,
  })
}

class Test extends InterfaceType {
  __typename = 'Test'

  a = field({
    type: Int,
  })
}

class Error extends InterfaceType {
  __typename = 'Error'

  message = field({
    type: Nullable(String),
  })
}

export type Prettier<T> = T extends (...args: infer Args) => infer Return
  ? (...args: Prettier<Args>) => Prettier<Return>
  : T extends object | any[]
  ? {
      [key in keyof T]: Prettier<T[key]>
    }
  : T

type T2 = TypeOf<Query>

type T3 = Prettier<T2>

type T4 = Prettier<TypeOf<Wind>>

type T5 = TypeOf<Language>

type T6 = TypeOf<Unit>
