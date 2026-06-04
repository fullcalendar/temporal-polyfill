import { localeOrdinalsData } from './localeOrdinalsData.js'
import { Ordinals } from './ordinals.js'

function expandOrdinals(): { [key: string]: Ordinals } {
  const obj = {} as { [key: string]: Ordinals }

  for (const key of Object.keys(localeOrdinalsData)) { // guarantees own properties
    const val = localeOrdinalsData[key as keyof typeof localeOrdinalsData]

    for (const locale of key.split('|')) {
      obj[locale] = val
    }
  }

  return obj
}

export const localeOrdinals = expandOrdinals()
