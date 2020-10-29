export type PrettyNumberOptions = {
  delimiter?: string
  separator?: string
}

export const defaultPrettyNumberOptions: Required<PrettyNumberOptions> = {
  delimiter: ',',
  separator: '.',
}

export const prettyNumber = function (number: number | string, options?: PrettyNumberOptions) {
  let config = {
    ...defaultPrettyNumberOptions,
    ...options,
  }
  let { delimiter, separator } = config
  let [first, ...rest] = number.toString().split('.')
  let text = first.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + delimiter)

  return [text, ...rest].join(separator)
}

export const prettyTime = (start: number): string => {
  const delta = Date.now() - start
  return prettyNumber(delta < 10000 ? delta + 'ms' : Math.round(delta / 1000) + 's')
}
