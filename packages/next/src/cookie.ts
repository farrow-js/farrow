import { parse, serialize, CookieSerializeOptions } from 'cookie'
import type { IncomingMessage, ServerResponse } from 'http'
import JSCookie, { CookieAttributes } from 'js-cookie'

export const get = (name: string, req?: IncomingMessage) => {
  if (!req) return JSCookie.get(name)
  let cookies = parse(req.headers.cookie || '') || {}
  return cookies[name]
}

const getSameSite = (opts: CookieSerializeOptions) => {
  let sameSite: CookieAttributes['sameSite']

  if (typeof opts.sameSite === 'boolean') {
    if (opts.sameSite) {
      sameSite = 'strict'
    }
  } else if (opts.sameSite) {
    sameSite = opts.sameSite
  }

  return sameSite
}

export const set = (name: string, value: string, options?: CookieSerializeOptions, res?: ServerResponse) => {
  let opts: CookieSerializeOptions = { ...options }
  let val = typeof value === 'object' ? `j:${JSON.stringify(value)}` : String(value)

  if (typeof opts.maxAge === 'number') {
    opts.expires = new Date(Date.now() + opts.maxAge)
    opts.maxAge /= 1000
  }

  if (!opts.path) {
    opts.path = '/'
  }

  if (!res) {
    return JSCookie.set(name, value, {
      ...opts,
      sameSite: getSameSite(opts),
    })
  }

  res.setHeader('Set-Cookie', serialize(name, String(val), opts))
}

export const remove = (name: string, options?: CookieSerializeOptions, res?: ServerResponse) => {
  let opts = { expires: new Date(1), path: '/', ...options }
  if (!res) {
    return JSCookie.set(name, '', {
      ...opts,
      sameSite: getSameSite(opts),
    })
  }
  return set(name, '', opts, res)
}
