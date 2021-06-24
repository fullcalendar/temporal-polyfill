import { readdirSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

const localeRoot = resolve('../../locales')

const localeList = readdirSync(localeRoot)

// Error out if no locales
if (localeList.length === 0) {
  console.error('Locales have not been generated')
  process.exit()
}

// Read files and reduce to locale comparison asynchronously
localeList
  .reduce(async (accumPromise, val) => {
    const json = JSON.parse(
      await readFile(resolve(localeRoot, val), {
        encoding: 'utf8',
      })
    )

    const minimalDays = json.week.minimalDays

    // Short circuit if minimalDays isn't a number
    if (typeof minimalDays !== 'number') {
      return accumPromise
    }

    const locale = val.replace('.json', '')

    // Get current state of accum
    const accum = await accumPromise

    return { ...accum, [locale]: minimalDays }
  }, Promise.resolve({}))
  .then((minimalDaysLocales) => {
    console.log(minimalDaysLocales)

    const code = `export const getMinimalDays = (locale: string): number => {
  return ${JSON.stringify(minimalDaysLocales, null, 2)}[locale]
}
`

    writeFileSync(resolve('src/minimalDays.ts'), code, {
      encoding: 'utf8',
      flag: 'w',
    })
    console.log('Wrote minimalDays.ts')
  })
