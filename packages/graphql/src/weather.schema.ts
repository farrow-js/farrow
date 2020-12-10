import fs from 'fs'
import path from 'path'
import {
  InputObjectType,
  Float,
  TypeOf,
  ObjectType,
  ID,
  Int,
  String,
  Nullable,
  List,
  ScalarType,
  EnumType,
  InterfaceType,
  EnumValueConfig,
  TypeOfInterface,
  TypeOfInterfaces,
  TypeOfObject,
  UnionType,
  Type,
  identity,
  Prettier,
} from './graphql'

import { printSchema } from 'graphql'

import { build } from './build'

class Point2D extends InputObjectType {
  name = identity('Point2D')

  fields = {
    x: {
      type: Float,
    },
    y: {
      type: Float,
    },
  }
}

type T0 = Prettier<TypeOf<Point2D>>

class City extends ObjectType {
  name = identity('City')

  description = 'City'

  fields = {
    id: {
      type: ID,
      description: 'City ID',
    },

    name: {
      type: String,
      description: 'City name',
    },

    country: {
      type: String,
      description: 'Country of City',
    },

    coord: {
      type: Coordinates,
      description: 'Coordinates of City',
    },

    weather: {
      type: Weather,
      description: 'Weather of City',
    },

    upload: {
      type: Upload,
    },
  }
}

class Coordinates extends ObjectType {
  name = identity('Coordinates')

  fields = {
    lon: {
      type: Float,
    },

    lat: {
      type: Float,
    },
  }
}

class Clouds extends ObjectType {
  name = identity('Clouds')

  description = 'Clouds'

  fields = {
    all: {
      type: Int,
    },

    visibility: {
      type: Int,
    },

    humidity: {
      type: Int,
    },
  }
}

class ConfigInput extends InputObjectType {
  name = identity('ConfigInput')

  fields = {
    units: {
      type: Unit,
    },

    lang: {
      type: Language,
    },
  }
}

class Language extends EnumType {
  name = 'Language' as const

  values = {
    af: {
      value: 0 as const,
    },

    al: {
      value: 1 as const,
    },
  }
}

class Query extends ObjectType {
  name = 'Query' as const

  fields = {
    getCityByName: {
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
    },

    getCityById: {
      args: {
        id: {
          type: Nullable(List(String)),
        },
        config: {
          type: Nullable(ConfigInput),
        },
      },
      type: List(City),
    },

    cityOrWeather: {
      type: CityOrWeather,
    },
  }
}

class CityOrWeather extends UnionType {
  name = 'CityOrWeather'

  types = [City, Weather]
}

type T7 = TypeOf<CityOrWeather>

class Summary extends ObjectType {
  name = 'Summary' as const

  fields = {
    title: {
      type: String,
    },

    description: {
      type: String,
    },

    icon: {
      type: String,
    },
  }
}

class Temperature extends ObjectType {
  name = 'Temperature' as const
  fields = {
    actual: {
      type: Float,
    },

    feelsLike: {
      type: Float,
    },

    min: {
      type: Float,
    },

    max: {
      type: Float,
    },
  }
}

class Unit extends EnumType {
  name = 'Unit' as const

  values = {
    metric: {
      value: 0 as const,
    },

    imperial: {
      value: 1 as const,
    },
    kelvin: {
      value: 2 as const,
    },
  }
}

class Upload extends ScalarType<'Upload'> {
  name = 'Upload' as const
}

class Weather extends ObjectType {
  name = 'Weather' as const
  fields = {
    summary: {
      type: Summary,
    },

    temperature: {
      type: Temperature,
    },

    wind: {
      type: Wind,
    },

    clouds: {
      type: Clouds,
    },

    timestamp: {
      type: Int,
    },
  }
}

class Wind extends ObjectType {
  name = 'Wind' as const

  interfaces = [Test, Error]

  fields = {
    speed: Float,
    deg: Int,
  }
}

class Test extends InterfaceType {
  name = 'Test' as const

  fields = {
    a: {
      type: Int,
    },
  }
}

class Error extends InterfaceType {
  name = 'Error' as const

  fields = {
    message: {
      type: Nullable(String),
    },
  }
}

type T2 = TypeOf<Query>

type T3 = Prettier<T2>

type T4 = Prettier<TypeOf<Wind>>

type T5 = TypeOf<Language>

type T6 = TypeOf<Unit>

type T8 = Prettier<TypeOf<City>>

const Schema = build({
  Query: Query,
})

const test = async () => {
  let filename = path.join(__dirname, 'weather.generate.graphql')
  await fs.promises.writeFile(filename, printSchema(Schema))
}

test()
