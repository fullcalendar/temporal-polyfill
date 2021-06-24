import { readdirSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

const localeRoot = resolve('../../locales')
const outputPath = resolve('src/direction.ts')

const localeList = readdirSync(localeRoot)

// Error out if no locales
if (localeList.length === 0) {
  console.error('Locales have not been generated')
  process.exit()
}

// Read files and reduce to locale comparison string asynchronously
localeList
  .reduce(async (accumPromise, val) => {
    const json = JSON.parse(
      await readFile(resolve(localeRoot, val), {
        encoding: 'utf8',
      })
    )

    const direction = json.text.direction

    // Short circuit if not RTL
    if (direction !== 'rtl') {
      return accumPromise
    }

    const locale = val.replace('.json', '')

    // Get current state of accum
    const accum = await accumPromise

    // Format into string
    return `${accum !== '' ? `${accum}|` : ''}${locale}`
  }, Promise.resolve(''))
  .then((rtlLocales) => {
    console.log(rtlLocales)

    const code = `export const getDirection = (locale: string): 'ltr' | 'rtl' => {
  return locale.match(/^(${rtlLocales})$/)
    ? 'rtl'
    : 'ltr'
}
`

    // Generate direction.ts
    writeFileSync(outputPath, code, { encoding: 'utf8', flag: 'w' })
    console.log('Wrote direction.ts')
  })
