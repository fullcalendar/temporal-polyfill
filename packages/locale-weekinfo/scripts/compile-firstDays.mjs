import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { localesReduceAsync } from '../../../scripts/lib/locales-list.mjs'

localesReduceAsync((accum, locale, json) => {
  const fd = json.week.firstDay

  return {
    ...accum,
    [fd]: accum[fd] ? [...accum[fd], locale] : [locale],
  }
}, {}).then((firstDayLocales) => {
  const fdArr = []

  for (const day in firstDayLocales) {
    // Optimization short circuit for default return
    if (day === '1') {
      continue
    }

    // TODO: Apply prefix processing, try to avoid making this O(n^2)
    const locales = firstDayLocales[day]

    // Code for if regex matches
    const conditional = `if (locale.match(/^((?:${locales.join(
      '|'
    )})(?:-\\w{2})?)$/)) {
    return ${day}
`

    fdArr.push(conditional)
  }

  const code = `/* eslint-disable */

export const getFirstDay = (locale: string): number => {
  ${fdArr.join('  } else ')}  }

  return 1
}
`

  writeFileSync(resolve('src/firstDay.ts'), code, {
    encoding: 'utf8',
    flag: 'w',
  })
  console.log('Wrote firstDay.ts')
})
