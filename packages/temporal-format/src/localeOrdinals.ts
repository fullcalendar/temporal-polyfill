import { Ordinals } from './ordinals'

const ordinals = {
  'et|fi': '.',
  'es|pt|pt-br': 'º',
  en: {
    one: 'st',
    two: 'nd',
    few: 'rd',
    other: 'th',
  },
  fr: {
    m: 'er',
    f: 're',
  },
}

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
