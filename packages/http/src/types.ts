export type MarkReadOnlyDeep<T> = T extends {} | any[]
  ? {
      readonly [key in keyof T]: MarkReadOnlyDeep<T[key]>
    }
  : T

type ParseUnion<T extends string> = T extends `${infer Left}|${infer Right}` ? Left | ParseUnion<Right> : T

type ValueTypeMap = {
  string: string
  number: number
  boolean: boolean
  int: number
  float: number
  id: string
}

type ParseItem<T extends string> = T extends keyof ValueTypeMap
  ? ValueTypeMap[T]
  : T extends `{${infer Literal}}`
  ? Literal
  : never

type ParseValue<T extends string> = ParseItem<ParseUnion<T>>

type ParseModifier<Key extends string, Value> = Key extends `${infer K}?`
  ? { [key in K]?: Value }
  : Key extends `${infer K}*`
  ? { [key in K]?: Value[] }
  : Key extends `${infer K}+`
  ? { [key in K]: Value[] }
  : { [key in Key]: Value }

type ParseDynamic<T extends string> = T extends `${infer _Left}<${infer Key}:${infer Value}>${infer Right}`
  ? ParseModifier<Key, ParseValue<Value>> & ParseDynamic<Right>
  : {}

type ParseStatic<T extends string> = T extends `${infer Key}=${infer Value}&${infer Right}`
  ? { [key in Key]: Value } & ParseStatic<Right>
  : T extends `${infer _Left}&${infer Right}`
  ? ParseStatic<Right>
  : T extends `${infer Key}=${infer Value}`
  ? { [key in Key]: Value }
  : {}

type ParseData<T extends string> = ParseDynamic<T> & ParseStatic<T>

type IsNotEmptyObjectKey<T, Key> = T extends object ? (keyof T extends never ? never : Key) : Key

type CleanEmptyObject<T extends object> = {
  [key in keyof T as IsNotEmptyObjectKey<T[key], key>]: T[key]
}

type ParsePathname<T extends string> = T extends `${infer Left}?${infer Right}`
  ? Right extends `:${infer Rest}`
    ? `${Left}?:${ParsePathname<Rest>}`
    : Left
  : T

type ParseQueryString<T extends string> = T extends `${infer _Left}?${infer Right}`
  ? Right extends `:${infer Rest}`
    ? ParseQueryString<Rest>
    : Right
  : ''

export type ParseUrl<T extends string> = CleanEmptyObject<{
  pathname: string
  params: ParseData<ParsePathname<T>>
  query: ParseData<ParseQueryString<T>>
}>

// type T0 = Prettier<ParseUrl<`/hello/<name?:string>?<age:int>&test=1`>>

// type T1 = Prettier<ParseUrl<`/hello/<name+:string>?test=1&<age?:int>`>>

// type T2 = Prettier<ParseUrl<`/hello/<name*:string|int>/<c*:{d}|{e}>?test=1&<age:int>&<a:{123}>&b?=1`>>

// type T3 = Prettier<ParseUrl<`/hello/world`>>

// type T4 = Prettier<ParseUrl<`/hello/world?a=1&b=2`>>

// type T5 = Prettier<ParseUrl<`/hello/<1name:string>/info`>>

// type T6 = Prettier<ParseUrl<`/hello?<a?:b>&<c?:d>`>>

// type T7 = Prettier<ParseUrl<`/hello?<a:{a}|{b}|{c}|{123}>&<c:d>`>>

// type T8 = Prettier<ParseUrl<`/hello/<a?:id>/<c?:float>`>>

// type T9 = Prettier<ParseUrl<'/<arg:string>'>>
