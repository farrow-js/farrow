import { TypeOf, Type, TypeCtor, ObjectType, UnionType, EnumType, Prettier, InternalScalarType } from './graphql'

// graphql field resolver can be thunk or async thunk
export type Thunk<T> = T extends (...args: any) => any ? T : T | (() => T) | (() => Promise<T>)

export type Maybe<T> = T | null | undefined

export type ResolvedValue<T> = Thunk<Maybe<T>>

export type MaybePromise<T> = T extends Promise<any> ? T : T | Promise<T>

export type ResolverType<T> = T extends UnionType
  ? ResolverType<TypeOf<T>>
  : T extends ObjectType
  ? Omit<
      {
        [key in keyof TypeOf<T>]: ResolvedValue<TypeOf<T>[key]>
      },
      '__typename'
    >
  : T

const typenameMap = new WeakMap<new () => ObjectType | UnionType, string>()

export const resolve = <T extends ObjectType | UnionType, V extends ResolverType<T>>(
  GraphQLType: new () => T,
  value: V,
): { __typename: TypeOf<T>['__typename'] } & V => {
  let typename = typenameMap.get(GraphQLType)
  if (!typename) {
    typename = new GraphQLType().name
    typenameMap.set(GraphQLType, typename)
  }
  // @ts-ignore ignore
  return {
    ...value,
    __typename: typename as TypeOf<T>['__typename'],
  }
}
