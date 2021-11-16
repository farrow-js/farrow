# farrow-http

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
