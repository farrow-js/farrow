import { TypeOf, Type, TypeCtor } from './graphql'

// graphql field resolver can be thunk or async thunk
export type Thunk<T> = T extends (...args: any) => any ? T : T | (() => T) | (() => Promise<T>)

export type ResolverType<T extends Type | TypeCtor> = T extends TypeCtor ? TypeOf<InstanceType<T>> : 1
