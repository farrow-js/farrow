import { vi } from 'vitest'

;(globalThis as any).jest = Object.assign({}, vi, {
  setTimeout: (timeout: number) => {
    vi.setConfig({ testTimeout: timeout })
  },
})
