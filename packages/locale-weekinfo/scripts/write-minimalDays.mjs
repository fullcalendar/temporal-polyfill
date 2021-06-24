import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { localesReduceAsync } from '../../../scripts/list-locales.mjs'

localesReduceAsync((accum, locale, json) => {
  const minimalDays = json.week.minimalDays

  return typeof minimalDays !== 'number'
    ? accum
    : { ...accum, [locale]: minimalDays }
}).then((minimalDaysLocales) => {
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
