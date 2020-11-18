import type { Middleware } from 'farrow-pipeline'
import {
  ResponseInfo,
  json,
  html,
  text,
  raw,
  redirect,
  stream,
  file,
  vary,
  cookie,
  cookies,
  header,
  headers,
  status,
  buffer,
  empty,
  attachment,
  custom,
  type,
  merge,
  BodyMap,
} from './responseInfo'

type ResponseInfoCreator = (...args: any) => ResponseInfo

type ToResponse<T extends ResponseInfoCreator> = (...args: Parameters<T>) => Response

export type Response = {
  info: ResponseInfo
  merge: (...responsers: Response[]) => Response
  json: ToResponse<typeof json>
  html: ToResponse<typeof html>
  text: ToResponse<typeof text>
  raw: ToResponse<typeof raw>
  redirect: ToResponse<typeof redirect>
  stream: ToResponse<typeof stream>
  file: ToResponse<typeof file>
  vary: ToResponse<typeof vary>
  cookie: ToResponse<typeof cookie>
  cookies: ToResponse<typeof cookies>
  header: ToResponse<typeof header>
  headers: ToResponse<typeof headers>
  status: ToResponse<typeof status>
  buffer: ToResponse<typeof buffer>
  empty: ToResponse<typeof empty>
  attachment: ToResponse<typeof attachment>
  custom: ToResponse<typeof custom>
  type: ToResponse<typeof type>
}

export const toResponse = <T extends ResponseInfoCreator>(
  f: T,
  info: ResponseInfo
): ToResponse<T> => {
  return (...args) => createResponse(merge(info, f(...(args as any[]))))
}

export const createResponse = (info: ResponseInfo): Response => {
  return {
    info,
    merge: (...responsers) => {
      let infos = responsers.map((responser) => responser.info)
      return createResponse(merge(info, ...infos))
    },
    json: toResponse(json, info),
    html: toResponse(html, info),
    text: toResponse(text, info),
    raw: toResponse(raw, info),
    redirect: toResponse(redirect, info),
    stream: toResponse(stream, info),
    file: toResponse(file, info),
    vary: toResponse(vary, info),
    cookie: toResponse(cookie, info),
    cookies: toResponse(cookies, info),
    header: toResponse(header, info),
    headers: toResponse(headers, info),
    status: toResponse(status, info),
    buffer: toResponse(buffer, info),
    empty: toResponse(empty, info),
    attachment: toResponse(attachment, info),
    custom: toResponse(custom, info),
    type: toResponse(type, info)
  }
}

export const Response = createResponse(empty())

export type MaybeAsyncResponse = Response | Promise<Response>

export const match = <T extends keyof BodyMap>(
  type: T,
  f: (body: BodyMap[T]) => MaybeAsyncResponse
): Middleware<any, MaybeAsyncResponse> => {
  return async (request, next) => {
    let response = await next(request)

    if (response.info.body?.type === type) {
      return response.merge(await f(response.info.body as BodyMap[T]))
    }

    return response
  }
}
