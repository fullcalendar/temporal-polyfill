import { localeOrdinals } from './localeOrdinals'
import { localeOrdinalsSpecial } from './localeOrdinalsSpecial'

export type Ordinals =
  | string
  | {
      [key: string]: string
    }

export const getOrdinalForValue = (
  num: number,
  unit: string,
  locale: string
): string => {
  // Use prefix as backup if specific locale cannot be found
  const prefix = locale.split('-')[0]
  const ordinals: Ordinals = localeOrdinals[locale] ?? localeOrdinals[prefix]

  // Short circuit to avoid PluralRules call in case of string
  if (typeof ordinals === 'string') {
    return ordinals
  }

  // Gets one of 'one', 'two', 'few', 'many', 'other'
  const count = new Intl.PluralRules(locale, { type: 'ordinal' }).select(num)

  if (localeOrdinalsSpecial[locale] || localeOrdinalsSpecial[prefix]) {
    // In this case ordinals refers only to the data part
    // Use prefix as backup if specific locale cannot be found
    return (
      localeOrdinalsSpecial[locale](ordinals, unit, count) ??
      localeOrdinalsSpecial[prefix](ordinals, unit, count)
    )
  }

  // Default to using PluralRules
  return ordinals[count]
}
