import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { localesReduceAsync } from '../../../scripts/lib/locales-list.mjs'

const templateCode = (obj) => {
  return `/* eslint-disable */

import { Ordinals } from './ordinals'

const ordinals = ${JSON.stringify(obj, null, 2)}

const expandOrdinals = (): { [key: string]: Ordinals } => {
  const obj = {}

  for (const key in ordinals) {
    const val = ordinals[key]

    for (const locale of key.split('|')) {
      obj[locale] = val
    }
  }

  return obj
}

export const localeOrdinals = expandOrdinals()
`
}

localesReduceAsync().then((locales) => {
  const ordinals = {}

  for (const locale in locales) {
    const ordinal = locales[locale].ordinal

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

  writeFileSync(resolve('src/localeOrdinals.ts'), templateCode(ordinals), {
    encoding: 'utf8',
    flag: 'w',
  })

  console.log('Wrote localeOrdinals.ts')
})
