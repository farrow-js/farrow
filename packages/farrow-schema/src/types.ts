// based on https://github.com/sindresorhus/type-fest/blob/master/source/readonly-deep.d.ts

export type Basic = null | undefined | string | number | boolean | symbol | bigint

export type DateInstanceType = Date

export type MarkReadOnlyDeep<T> = T extends Basic | ((...args: any[]) => unknown)
  ? T
  : T extends ReadonlyMap<infer KeyType, infer ValueType>
  ? ReadOnlyMapDeep<KeyType, ValueType>
  : T extends ReadonlySet<infer ItemType>
  ? ReadOnlySetDeep<ItemType>
  : T extends {}
  ? ReadOnlyObjectDeep<T>
  : unknown

/**
Same as `ReadonlyDeep`, but accepts only `ReadonlyMap`s as inputs. Internal helper for `ReadonlyDeep`.
*/
type ReadOnlyMapDeep<KeyType, ValueType> = ReadonlyMap<MarkReadOnlyDeep<KeyType>, MarkReadOnlyDeep<ValueType>>

/**
Same as `ReadonlyDeep`, but accepts only `ReadonlySet`s as inputs. Internal helper for `ReadonlyDeep`.
*/
type ReadOnlySetDeep<ItemType> = ReadonlySet<MarkReadOnlyDeep<ItemType>>

/**
Same as `ReadonlyDeep`, but accepts only `object`s as inputs. Internal helper for `ReadonlyDeep`.
*/
type ReadOnlyObjectDeep<ObjectType extends object> = {
  readonly [KeyType in keyof ObjectType]: MarkReadOnlyDeep<ObjectType[KeyType]>
}
