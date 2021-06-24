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

    const firstDay = json.week.firstDay

    // Short circuit if firstDay isn't a number
    if (typeof firstDay !== 'number') {
      return accumPromise
    }

    const locale = val.replace('.json', '')

    // Get current state of accum
    const accum = await accumPromise

    return { ...accum, [locale]: firstDay }
  }, Promise.resolve({}))
  .then((firstDayLocales) => {
    console.log(firstDayLocales)

    const code = `export const getFirstDay = (locale: string): number => {
  return ${JSON.stringify(firstDayLocales, null, 2)}[locale]
}
`

    writeFileSync(resolve('src/firstDay.ts'), code, {
      encoding: 'utf8',
      flag: 'w',
    })
    console.log('Wrote firstDay.ts')
  })
