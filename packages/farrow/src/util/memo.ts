export function memo<T>(f: () => T): typeof f
export function memo<T>(f: () => Promise<T>): typeof f
export function memo(f: () => any): any {
  let result: any = null

  return () => {
    if (result) return result
    result = f()
    return result
  }
}
