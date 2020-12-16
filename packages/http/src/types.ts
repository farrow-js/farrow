export type MarkReadOnlyDeep<T> = T extends object | any[]
  ? {
      readonly [key in keyof T]: MarkReadOnlyDeep<T[key]>
    }
  : T
