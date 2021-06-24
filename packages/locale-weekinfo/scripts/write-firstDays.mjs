import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { localesReduceAsync } from '../../../scripts/list-locales.mjs'

localesReduceAsync((accum, locale, json) => {
  const firstDay = json.week.firstDay

  return typeof firstDay !== 'number' ? accum : { ...accum, [locale]: firstDay }
}, {}).then((firstDayLocales) => {
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
