# farrow-http

## 1.10.12

### Patch Changes

- 79b05cf: Fix http route match basename bug

## 1.10.11

### Patch Changes

- 56ef151: Fix `router.route` match error

## 1.10.10

### Patch Changes

- 90dcb14: support ignoring the log of introspection request of farrow-api

## 1.10.10(2021/11/06)

- support ignoring the log of introspection request of farrow-api

```ts
type HttpLoggerOptions = LoggerOptions & {
  /**
   * it should ignore the introspection request log or not
   * default is true
   */
  ignoreIntrospectionRequestOfFarrowApi?: boolean
}
```
