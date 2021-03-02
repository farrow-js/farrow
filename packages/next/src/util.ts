export const identity = <X>(x: X): X => x

export const isPlainObject = (obj: any) => {
  if (typeof obj !== 'object' || obj === null) return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}

export const shallowEqual = (objA: any, objB: any) => {
  if (objA === objB) {
    return true
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false
  }

  let keysA = Object.keys(objA)
  let keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) {
    return false
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
      return false
    }
  }

  return true
}

export const isThenble = (input: any): boolean => !!(input && typeof input.then === 'function')

export const forcePlainDataCheck = (input: any, path = ''): void => {
  if (input === null) return

  let type = typeof input

  if (type === 'function') {
    throw new Error(`Expected plain data, but found a function in ${path}: ${input}`)
  }

  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i += 1) {
      forcePlainDataCheck(input[i], `${path}[${i}]`)
    }
    return
  }

  if (type === 'object') {
    if (!isPlainObject(input)) {
      throw new Error(`Expected plain object, but found an instance of ${input.constructor} in path ${path}: ${input}`)
    }
    for (let key in input) {
      forcePlainDataCheck(input[key], `${path}.${key}`)
    }
  }
}

const wrapFunctionForChecking = (f: (...args: any) => any) => (...args: any) => {
  forcePlainDataCheck(args)
  return f(...args)
}

export const forceCheckValue = (value: any): any => {
  if (typeof value === 'function') {
    return wrapFunctionForChecking(value)
  }

  if (Array.isArray(value)) {
    return forceCheckArray(value)
  }

  if (isPlainObject(value)) {
    return forceCheckObject(value)
  }

  return value
}

const forceCheckObject = <T extends object>(object: T): T => {
  let result = {} as any
  for (let key in object) {
    result[key] = forceCheckValue(object[key])
  }
  return result as T
}

const forceCheckArray = <T extends any[]>(array: T): T => {
  let result = [] as any
  for (let i = 0; i < array.length; i += 1) {
    result[i] = forceCheckValue(array[i])
  }
  return result as T
}
