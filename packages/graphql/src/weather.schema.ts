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
  typename,
  Prettier,
  TypeCtor,
  ResolverType,
  Resolver,
} from './graphql'

import { printSchema } from 'graphql'

import { build } from './build'

class Point2D extends ObjectType {
  name = typename('Point2D')

  fields = {
    x: {
      type: Float,
    },
    y: {
      type: Float,
    },
  }
}

class Point2DResolver extends Resolver(Point2D) {
  constructor(public x: number, public y: number) {
    super()
  }

  resolver = {
    x: this.x,
    y: this.y,
  }
}

const resolvePoint2D = (x: number, y: number) => {
  return Point2D.resolve({
    x,
    y,
  })
}

let point0 = new Point2DResolver(0, 0)
let point1 = resolvePoint2D(0, 0)

class Point3D extends ObjectType {
  name = typename('Point3D')

  fields = {
    x: {
      type: Float,
    },
    y: {
      type: Float,
    },
    z: {
      type: Float,
    },
  }
}

const resolvePoint3D = (x: number, y: number, z: number) => {
  return Point3D.resolve({
    x: () => x,
    y,
    z,
  })
}

class Point extends UnionType {
  name = typename('Point')
  types = [Point2D, Point3D]
}

const resolvePoint = (x: number, y: number, z?: number): ResolverType<Point> => {
  if (typeof z !== 'number') {
    return resolvePoint2D(x, y)
  }
  return resolvePoint3D(x, y, z)
}

const p0 = resolvePoint(0, 0, 0)

type P0 = Prettier<typeof p0>

type T0 = Prettier<TypeOf<Point2D>>

class City extends ObjectType {
  name = typename('City')

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
  name = typename('Coordinates')

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
  name = typename('Clouds')

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
  name = typename('ConfigInput')

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

type T10 = ResolverType<Query>

type T11 = Prettier<T10>

const Schema = build({
  Query,
})

const test = async () => {
  let filename = path.join(__dirname, 'weather.generate.graphql')
  await fs.promises.writeFile(filename, printSchema(Schema))
}

test().catch(console.error)
