import * as S from './schema'
import { SchemaCtor, TypeOf, Schema, SchemaTypeOf, JsonType } from './schema'

import { getInstance } from './instance'
import { Result, Err, Ok } from './result'

export type FormatterOptions = {}


export type ScalarFormatResult = {
  type: 'ScalarFormatResult'
  name: string
  value: JsonType
}

export type ObjectFormatResult = {
  type: 'ObjectFormatResult'
  name: string
  value: JsonType
}

export type ListFormatResult = {
  type: 'ListFormatResult'
  name: string
  value: JsonType
}

export type FormatResult = ScalarFormatResult | ListFormatResult | ObjectFormatResult

export type Formatter<T = any> = (options?: FormatterOptions) => FormatResult

export type FormatterMethods<T extends Schema = Schema> = {
  format: Formatter<TypeOf<T>>
}

export type FormatterImpl<T extends Schema = Schema> = FormatterMethods<T> | ((schema: T) => FormatterMethods<T>)

const formatterWeakMap = new WeakMap<Function, FormatterImpl>()

const getFormatterImpl = (input: Function): FormatterImpl | undefined => {
  if (typeof input !== 'function') {
    return undefined
  }

  if (formatterWeakMap.has(input)) {
    return formatterWeakMap.get(input)
  }

  let next = Object.getPrototypeOf(input)

  if (next === Function.prototype) {
    return undefined
  }

  return getFormatterImpl(next)
}

export const Formatter = {
  impl<T extends Schema>(Ctor: abstract new () => T, impl: FormatterImpl<T>) {
    formatterWeakMap.set(Ctor, impl as FormatterImpl)
  },

  get<T extends SchemaCtor>(Ctor: T): FormatterMethods<SchemaTypeOf<T>> | undefined {
    let finalCtor = S.getSchemaCtor(Ctor)
    let FormatterImpl = getFormatterImpl(finalCtor as Function) as FormatterImpl<SchemaTypeOf<T>> | undefined

    // instantiation formatter and save to weak-map
    if (typeof FormatterImpl === 'function') {
      let schema = getInstance(Ctor) as SchemaTypeOf<T>
      let impl = FormatterImpl(schema)

      formatterWeakMap.set(Ctor, impl)

      return impl
    }

    return FormatterImpl
  },

  format<T extends SchemaCtor>(Ctor: T, options?: FormatterOptions): FormatResult {
    let FormatterImpl = Formatter.get(Ctor)

    if (!FormatterImpl) {
      throw new Error(`No impl found for Validator, Ctor: ${Ctor}`)
    }

    return FormatterImpl.format(options) as FormatResult
  },
}
