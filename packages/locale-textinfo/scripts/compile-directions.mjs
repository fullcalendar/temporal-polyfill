import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { localesReduceAsync } from '../../../scripts/lib/locales-list.mjs'

localesReduceAsync().then((locales) => {
  const rtlArr = []

  for (const locale in locales) {
    const direction = locales[locale].text.direction

    if (direction === 'rtl') {
      const prefix = locale.split('-')[0]

      // Checks if either value is a prefix or if the values direction is 'rtl' as compared to the prefix's 'ltr'
      if (locale === prefix || locales[prefix].text.direction !== direction) {
        rtlArr.push(locale)
      }
    }
  }

  const code = `/* eslint-disable */

export const getDirection = (locale: string): 'ltr' | 'rtl' => {
  return locale.match(/^((?:${rtlArr.join('|')})(?:-\\w{2})?)$/)
    ? 'rtl'
    : 'ltr'
}
`

  writeFileSync(resolve('src/direction.ts'), code, {
    encoding: 'utf8',
    flag: 'w',
  })

  console.log('Wrote direction.ts')
})
