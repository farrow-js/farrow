# farrow-http

## 1.11.2

### Patch Changes

- 2eb1d69: Performance Optimize
- Updated dependencies [2eb1d69]
  - farrow-pipeline@1.11.3

## 1.11.1

### Patch Changes

- 7d469aa: Fix https typo
- 5052544: Performance Optimize
- Updated dependencies [5052544]
  - farrow-pipeline@1.11.2

## 1.11.0

### Minor Changes

- 8c8f010: Update the dependency for DX

### Patch Changes

- Updated dependencies [8c8f010]
  - farrow-pipeline@1.11.0
  - farrow-schema@1.11.0

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
