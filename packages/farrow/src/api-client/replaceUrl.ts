import { replaceInFile } from 'replace-in-file'
import { ApiClientOptions } from './index'

export const urlToReplaceRegex = /export const url = ('.*?'|".*?")/
export const replaceUrl = async (options: ApiClientOptions) => {
  const { src, alias, dist } = options
  try {
    const results = await replaceInFile({
      files: dist,
      from: urlToReplaceRegex,
      to: `export const url = '${alias ?? src ?? ''}'`,
    })
    // only one file pass to replaceInFile, so one length array result is excepted
    if (results.length === 1) {
      const result = results[0]
      if (result.hasChanged) {
        console.log(`replacement: ${dist} success`)
      } else {
        console.log(`replacement: ${dist} nothing replaced`)
      }
    } else {
      console.log(`replacement: ${dist} nothing replaced`)
    }
  } catch (error) {
    console.log(`replacement: ${dist} failed`, error)
  }
}

export const build = async (options: ApiClientOptions) => {
  await replaceUrl(options)
}
