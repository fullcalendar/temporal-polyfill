import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { localesReduceAsync } from '../../../scripts/lib/locales-list.mjs'

localesReduceAsync((accum, locale, json) => {
  const md = json.week.minimalDays

  return {
    ...accum,
    [md]: accum[md] ? [...accum[md], locale] : [locale],
  }
}, {}).then((minimalDaysLocales) => {
  const mdArr = []

  for (const day in minimalDaysLocales) {
    // Optimization short circuit for default return
    if (day === '6') {
      continue
    }

    // TODO: Apply prefix processing, try to avoid making this O(n^2)
    const locales = minimalDaysLocales[day]

    // Code for if regex matches
    const conditional = `if (locale.match(/^((?:${locales.join(
      '|'
    )})(?:-\\w{2})?)$/)) {
    return ${day}
`

    mdArr.push(conditional)
  }

  const code = `/* eslint-disable */

export const getMinimalDays = (locale: string): number => {
  ${mdArr.join('  } else ')}  }

  return 6
}
`

  writeFileSync(resolve('src/minimalDays.ts'), code, {
    encoding: 'utf8',
    flag: 'w',
  })
  console.log('Wrote minimalDays.ts')
})
