// based on https://github.com/sindresorhus/type-fest/blob/master/source/readonly-deep.d.ts

export type Basic = null | undefined | string | number | boolean | symbol | bigint

/**
Convert `object`s, `Map`s, `Set`s, and `Array`s and all of their keys/elements into immutable structures recursively.
This is useful when a deeply nested structure needs to be exposed as completely immutable, for example, an imported JSON module or when receiving an API response that is passed around.
Please upvote [this issue](https://github.com/microsoft/TypeScript/issues/13923) if you want to have this type as a built-in in TypeScript.
@example
```
// data.json
{
	"foo": ["bar"]
}
// main.ts
import dataJson = require('./data.json');
const data: ReadonlyDeep<typeof dataJson> = dataJson;
export default data;
// test.ts
import data from './main';
data.foo.push('bar');
//=> error TS2339: Property 'push' does not exist on type 'readonly string[]'
```
*/
export type MarkReadOnlyDeep<T> = T extends Basic | ((...args: any[]) => unknown)
  ? T
  : T extends ReadonlyMap<infer KeyType, infer ValueType>
  ? ReadOnlyMapDeep<KeyType, ValueType>
  : T extends ReadonlySet<infer ItemType>
  ? ReadOnlySetDeep<ItemType>
  : T extends object
  ? ReadOnlyObjectDeep<T>
  : unknown

/**
Same as `ReadonlyDeep`, but accepts only `ReadonlyMap`s as inputs. Internal helper for `ReadonlyDeep`.
*/
interface ReadOnlyMapDeep<KeyType, ValueType> extends ReadonlyMap<MarkReadOnlyDeep<KeyType>, MarkReadOnlyDeep<ValueType>> {}

/**
Same as `ReadonlyDeep`, but accepts only `ReadonlySet`s as inputs. Internal helper for `ReadonlyDeep`.
*/
interface ReadOnlySetDeep<ItemType> extends ReadonlySet<MarkReadOnlyDeep<ItemType>> {}

/**
Same as `ReadonlyDeep`, but accepts only `object`s as inputs. Internal helper for `ReadonlyDeep`.
*/
type ReadOnlyObjectDeep<ObjectType extends object> = {
  readonly [KeyType in keyof ObjectType]: MarkReadOnlyDeep<ObjectType[KeyType]>
}
