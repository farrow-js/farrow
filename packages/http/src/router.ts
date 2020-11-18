import { createPipeline, Middleware } from 'farrow-pipeline'
import { createRouterPipeline } from './createRouterPipeline'
import { Response } from './response'

const middlewaresMap = new WeakMap<Schema, Middleware<any, any>[]>()

export abstract class Schema {
  __typename?: string
}

export type SchemaCtor<T extends Schema> = new () => T

export const typename = <T extends string>(name: T) => name

export class Number extends Schema {
  __typename = typename('Number')
}

export class Int extends Schema {
  __typename = typename('Int')
}

export class Float extends Schema {
  __typename = typename('Float')
}

export class String extends Schema {
  __typename = typename('String')
}

export class Boolean extends Schema {
  __typename = typename('Boolean')
}

export class Record extends Schema {
  __typename = typename('Record')
}


export abstract class ListType<T extends SchemaCtor<Schema>> extends Schema {
  abstract itemType: T
}

export const List = <T extends SchemaCtor<Schema>>(Type: T) => {
  return class List extends ListType<T> {
    __typename = typename(`[${new Type().__typename ?? ''}]`)
    itemType = Type
  }
}

export type TypeOf<T> = 
  T extends new () => Schema ? TypeOf<InstanceType<T>> :
  T extends Number ? number :
  T extends String ? string :
  T extends Boolean ? boolean :
  T extends Record ? {
    [key in keyof T as T[key] extends new () => Schema ? key : never]: TypeOf<T[key]>
  }
  : T

class Detail extends Record {
  id = Number
  tab = String
  isOpen = Boolean
}

type T0 = TypeOf<Detail>

type T1 = Detail['id']

const createRouter = <T extends new () => Schema>(Schema: T) => {
  let router = createPipeline
}