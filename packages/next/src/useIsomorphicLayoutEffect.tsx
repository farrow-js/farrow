import { useEffect, useLayoutEffect } from 'react'

export const useIsomorphicLayoutEffect =
  // tslint:disable-next-line: strict-type-predicates
  typeof window !== 'undefined' &&
  // tslint:disable-next-line: strict-type-predicates
  typeof window.document !== 'undefined' &&
  // tslint:disable-next-line: deprecation & strict-type-predicates
  typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect
