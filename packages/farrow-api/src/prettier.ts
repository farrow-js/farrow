import prettier from 'prettier'
import { cosmiconfigSync } from 'cosmiconfig'

const explorer = cosmiconfigSync('prettier')

const prettierConfig = explorer.search()

export const format = (source: string): string => {
  return prettier.format(source, {
    semi: false,
    printWidth: 120,
    singleQuote: true,
    parser: 'typescript',
    ...prettierConfig?.config,
  })
}
