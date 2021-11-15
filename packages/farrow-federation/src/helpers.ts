import { FormatApi } from 'farrow-api/dist/toJSON'
import { FormatType, FormatField, FormatFields } from 'farrow-schema/formatter'
import nodeFetch from 'node-fetch'
import type { Fetch, Fetcher } from './federation'

export const createFetcher = (fetch: Fetch = nodeFetch as any): Fetcher => {
  return async (request) => {
    const { url, calling, options: init } = request

    const options: RequestInit = {
      method: 'POST',
      credentials: 'include',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      body: JSON.stringify(calling),
    }
    const response = await fetch(url, options)

    return response.json()
  }
}

export const updateType = (type: FormatType, base: number): FormatType => {
  switch (type.type) {
    case 'Scalar': {
      return type
    }
    case 'Object': {
      return {
        ...type,
        fields: updateFields(type.fields, base),
      }
    }
    case 'Union': {
      const itemTypes = type.itemTypes.map((type) => {
        const typeId = type.typeId + base
        return {
          ...type,
          typeId,
          $ref: `#/types/${typeId}`,
        }
      })

      return {
        ...type,
        itemTypes,
      }
    }
    case 'Struct': {
      return {
        ...type,
        fields: updateFields(type.fields, base),
      }
    }
    case 'Record': {
      const valueTypeId = type.valueTypeId + base
      return {
        ...type,
        valueTypeId,
        $ref: `#/types/${valueTypeId}`,
      }
    }
    case 'List': {
      const itemTypeId = type.itemTypeId + base
      return {
        ...type,
        itemTypeId,
        $ref: `#/types/${itemTypeId}`,
      }
    }
    case 'Literal': {
      return type
    }
    case 'Nullable': {
      const itemTypeId = type.itemTypeId + base
      return {
        ...type,
        itemTypeId,
        $ref: `#/types/${itemTypeId}`,
      }
    }
    case 'Intersect': {
      const itemTypes = type.itemTypes.map((type) => {
        const typeId = type.typeId + base
        return {
          ...type,
          typeId,
          $ref: `#/types/${typeId}`,
        }
      })

      return {
        ...type,
        itemTypes,
      }
    }
    case 'Tuple': {
      const itemTypes = type.itemTypes.map((type) => {
        const typeId = type.typeId + base
        return {
          ...type,
          typeId,
          $ref: `#/types/${typeId}`,
        }
      })

      return {
        ...type,
        itemTypes,
      }
    }
    case 'Strict': {
      const itemTypeId = type.itemTypeId + base
      return {
        ...type,
        itemTypeId,
        $ref: `#/types/${itemTypeId}`,
      }
    }
    case 'NonStrict': {
      const itemTypeId = type.itemTypeId + base
      return {
        ...type,
        itemTypeId,
        $ref: `#/types/${itemTypeId}`,
      }
    }
    case 'ReadOnly': {
      const itemTypeId = type.itemTypeId + base
      return {
        ...type,
        itemTypeId,
        $ref: `#/types/${itemTypeId}`,
      }
    }
    case 'ReadOnlyDeep': {
      const itemTypeId = type.itemTypeId + base
      return {
        ...type,
        itemTypeId,
        $ref: `#/types/${itemTypeId}`,
      }
    }
    default: {
      throw new Error(`Unknown type: ${(type as FormatType).type} of FormatType`)
    }
  }
}

export const updateApi = (api: FormatApi, base: number): FormatApi => {
  return {
    ...api,
    input: updateField(api.input, base),
    output: updateField(api.output, base),
  }
}

export const updateFields = (fields: FormatFields, base: number): FormatFields => {
  const newFields: FormatFields = {}

  for (const key in fields) {
    newFields[key] = updateField(fields[key], base)
  }

  return newFields
}

export const updateField = (type: FormatField, base: number): FormatField => {
  const typeId = type.typeId + base

  return {
    ...type,
    typeId,
    $ref: `#/types/${typeId}`,
  }
}
