import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { localesReduceAsync } from '../../../scripts/lib/locales-list.mjs'

const templateCode = (obj) => {
  return `/* eslint-disable */

export const localeOrdinalsData = ${JSON.stringify(obj, null, 2)}
`
}

localesReduceAsync().then((locales) => {
  const ordinals = {}

  for (const [locale, { ordinal }] of Object.entries(locales)) {
    if (ordinal) {
      const existingKey = Object.keys(ordinals).find((key) => {
        return ordinals[key] === ordinal
      })

      if (existingKey) {
        ordinals[`${existingKey}|${locale}`] = ordinal
        delete ordinals[existingKey]
      } else {
        ordinals[locale] = ordinal
      }
    }
  }

  writeFileSync(resolve('src/localeOrdinalsData.ts'), templateCode(ordinals), {
    encoding: 'utf8',
    flag: 'w',
  })

  console.log('Wrote localeOrdinalsData.ts')
})
