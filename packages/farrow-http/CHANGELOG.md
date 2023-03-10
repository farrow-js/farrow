# farrow-http

## 2.0.1

### Patch Changes

- 1f9b7fb: upgrade for version 2.0
- Updated dependencies [1f9b7fb]
  - farrow-pipeline@2.0.1
  - farrow-schema@2.0.1

## 2.0.0

### Major Changes

- 1f9b7fb: upgrade for version 2.0

### Patch Changes

- Updated dependencies [1f9b7fb]
  - farrow-pipeline@2.0.0
  - farrow-schema@2.0.0

## 1.12.0

### Minor Changes

- a677bf2: refactor(api): client generation

### Patch Changes

- Updated dependencies [baa01b6]
- Updated dependencies [9fc22b7]
- Updated dependencies [a677bf2]
  - farrow-schema@1.12.0
  - farrow-pipeline@1.12.0

## 1.11.4

### Patch Changes

- 8db4ea6: set compile option: `target` to es5
- Updated dependencies [8db4ea6]
  - farrow-pipeline@1.11.4
  - farrow-schema@1.11.1

## 1.11.3

### Patch Changes

- 797144c: Fix http async pipeline

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
