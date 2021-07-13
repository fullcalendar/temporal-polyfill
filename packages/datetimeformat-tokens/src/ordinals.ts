import { localeOrdinals } from './localeOrdinals'
import { localeOrdinalsSpecial } from './localeOrdinalsSpecial'

export type SymbolOrdinals = string

export type NumberOrdinals = {
  one: string
  two: string
  few: string
  other: string
}

export type SpecialOrdinals = {
  [key: string]: string
}

export type Ordinals = SymbolOrdinals | NumberOrdinals | SpecialOrdinals

export const isSymbolOrdinals = (
  _locale: string,
  ordinals: Ordinals
): ordinals is SymbolOrdinals => {
  return typeof ordinals === 'string'
}

export const isNumberOrdinals = (
  locale: string,
  ordinals: Ordinals
): ordinals is NumberOrdinals => {
  return typeof ordinals === 'object' && !isSpecialOrdinals(locale, ordinals)
}

export const isSpecialOrdinals = (
  locale: string,
  ordinals: Ordinals
): ordinals is SpecialOrdinals => {
  // Use prefix as backup if specific locale cannot be found
  const specialsFunction =
    localeOrdinalsSpecial[locale] ?? localeOrdinalsSpecial[locale.split('-')[0]]
  return typeof ordinals === 'object' && specialsFunction !== undefined
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
  if (isSymbolOrdinals(locale, ordinals)) {
    return ordinals
  }

  // Gets one of 'one', 'two', 'few', 'many', 'other'
  const count = new Intl.PluralRules(locale, { type: 'ordinal' }).select(num)

  if (isSpecialOrdinals(locale, ordinals)) {
    // In this case ordinals refers only to the data part
    // Use prefix as backup if specific locale cannot be found
    return (
      localeOrdinalsSpecial[locale](ordinals, unit, count) ??
      localeOrdinalsSpecial[prefix](ordinals, unit, count)
    )
  }

  // Default to a NumberOrdinal using PluralRules
  return ordinals[count]
}
