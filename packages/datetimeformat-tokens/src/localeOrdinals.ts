import { localeOrdinalsData } from './localeOrdinalsData'
import { Ordinals } from './ordinals'

const expandOrdinals = (): { [key: string]: Ordinals } => {
  const obj = {}

  for (const key in localeOrdinalsData) {
    const val = localeOrdinalsData[key]

    for (const locale of key.split('|')) {
      obj[locale] = val
    }
  }

  return obj
}

export const localeOrdinals = expandOrdinals()
