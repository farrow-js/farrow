export type StreamingJsonParser = {
  write: (chunk: string) => void
}

export type CreateStreamingJsonParserOptions = {
  onJson: (json: any) => void
}

/**
 * streaming json is delimited by '\n'
 * streaming json parser just read and wait for '\n' and parse the json
 * then call the onJson callback
 */
export const createStreamingJsonParser = (options: CreateStreamingJsonParserOptions): StreamingJsonParser => {
  let buffer = ''

  return {
    write(chunk) {
      buffer += chunk

      while (true) {
        const index = buffer.indexOf('\n')

        if (index === -1) {
          break
        }

        const json = buffer.slice(0, index)

        buffer = buffer.slice(index + 1)

        if (json) {
          options.onJson(JSON.parse(json))
        }
      }
    },
  }
}
